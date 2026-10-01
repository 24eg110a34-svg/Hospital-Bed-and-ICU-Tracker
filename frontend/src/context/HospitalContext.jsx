import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
  authService, api, getToken, setToken, getStoredUser, setStoredUser, clearAuth, setUnauthorizedHandler, WS_URL,
} from '../services/api';

const HospitalContext = createContext(null);

const TOPICS = [
  '/topic/beds',
  '/topic/patients',
  '/topic/allocations',
  '/topic/reservations',
  '/topic/ambulances',
  '/topic/notifications',
  '/topic/command-center',
];

export const HospitalProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [booting, setBooting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [latestEvent, setLatestEvent] = useState(null);
  const [activity, setActivity] = useState([]);
  const [resyncTick, setResyncTick] = useState(0);

  const clientRef = useRef(null);
  const subscriptionsRef = useRef(new Map());
  const toastId = useRef(0);
  const activityId = useRef(0);

  const describeEvent = useCallback((topic, payload) => {
    const d = payload?.data || {};
    const bed = d.bedNumber;
    const patient = d.patientName;
    const label = (text, tone) => ({ id: ++activityId.current, at: Date.now(), text, tone, topic });
    const statusTone = (s) => (s === 'AVAILABLE' ? 'success' : s === 'CLEANING' ? 'warning' : 'info');

    switch (payload?.type) {
      case 'BED_AVAILABLE':
        return bed ? label(`Bed ${bed} became available`, 'success') : null;
      case 'BED_CLEANING':
        return bed ? label(`Bed ${bed} entered cleaning`, 'warning') : null;
      case 'BED_RESERVED':
        return bed ? label(`Bed ${bed} reserved`, 'info') : null;
      case 'BED_BLOCKED':
        return bed ? label(`Bed ${bed} blocked`, 'warning') : null;
      case 'BED_STATUS_CHANGED':
        return bed ? label(`Bed ${bed} is now ${d.newStatus || d.status}`, statusTone(d.newStatus || d.status)) : null;
      case 'BED_ALLOCATED':
        return topic === '/topic/allocations' && bed
          ? label(`Bed ${bed} allocated`, 'success')
          : null;
      case 'BED_RELEASED':
        return bed ? label(`Bed ${bed} released`, 'info') : null;
      case 'PATIENT_REGISTERED':
        return patient
          ? label(`${patient} registered at emergency${d.triageLevel ? ` · L${d.triageLevel}` : ''}`, 'info')
          : null;
      case 'PATIENT_TRIAGE_COMPLETED':
        return patient ? label(`${patient} triaged to level ${d.triageLevel}`, 'info') : null;
      case 'PATIENT_TRIAGE_CHANGED':
        return patient ? label(`${patient} triage ${d.oldTriageLevel} to ${d.newTriageLevel}`, 'info') : null;
      case 'PATIENT_ADMITTED':
        return patient
          ? label(`${patient} admitted${bed ? ` to ${bed}` : ''}`, 'success')
          : null;
      case 'PATIENT_DISCHARGED':
        return patient ? label(`${patient} discharged from ${bed || 'bed'}`, 'info') : null;
      case 'PATIENT_STATUS_CHANGED':
        return label(`Patient status now ${d.newStatus}`, statusTone(d.newStatus));
      case 'PATIENT_VITALS_UPDATED':
        return d.spo2 != null ? label(`Vitals updated · SpO2 ${d.spo2}%`, 'info') : null;
      case 'AMBULANCE_UPDATED':
        return d.vehicleNumber ? label(`Ambulance ${d.vehicleNumber} is ${d.newStatus}`, 'info') : null;
      case 'ALERT_CREATED':
        return d.title
          ? label(d.title, d.severity === 'CRITICAL' ? 'critical' : d.severity === 'WARNING' ? 'warning' : 'info')
          : null;
      default:
        return null;
    }
  }, []);

  const pushToast = useCallback((message, type = 'INFO', title = null) => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-4), { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* token may already be invalid */ }
    clearAuth();
    setUser(null);
    subscriptionsRef.current.clear();
    if (clientRef.current) {
      try { clientRef.current.deactivate(); } catch { /* already down */ }
      clientRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setConnected(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const validate = async () => {
      if (!getToken()) {
        if (!cancelled) setBooting(false);
        return;
      }
      try {
        const { data } = await authService.me();
        if (cancelled) return;
        if (data?.username) {
          const existing = getStoredUser();
          const merged = { ...(existing || {}), ...data };
          setStoredUser(merged);
          setUser(merged);
        }
      } catch {
        if (!cancelled) {
          clearAuth();
          setUser(null);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    };
    validate();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) {
      if (clientRef.current) {
        try { clientRef.current.deactivate(); } catch { /* already down */ }
        clientRef.current = null;
      }
      setConnected(false);
      return undefined;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        TOPICS.forEach((topic) => {
          const subscription = client.subscribe(topic, (message) => {
            let payload;
            try { payload = JSON.parse(message.body); } catch { return; }
            setLatestEvent({ topic, payload, receivedAt: Date.now() });
            const entry = describeEvent(topic, payload);
            if (entry) {
              setActivity((prev) => [entry, ...prev].slice(0, 60));
            }
            if (topic === '/topic/notifications' && payload?.data?.title) {
              pushToast(payload.data.message, payload.data.severity || 'INFO', payload.data.title);
            }
          });
          subscriptionsRef.current.set(topic, subscription);
        });
        setResyncTick((tick) => tick + 1);
      },
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
      debug: () => {},
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionsRef.current.clear();
      try { client.deactivate(); } catch { /* already down */ }
      clientRef.current = null;
      setConnected(false);
    };
  }, [user, pushToast, describeEvent]);

  const login = useCallback(async (username, password) => {
    const { data } = await authService.login(username, password);
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const can = useCallback((...roles) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  }, [user]);

  const value = {
    user,
    booting,
    connected,
    toasts,
    latestEvent,
    activity,
    resyncTick,
    login,
    logout,
    can,
    pushToast,
    dismissToast,
  };

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
};

export const useHospital = () => useContext(HospitalContext);
