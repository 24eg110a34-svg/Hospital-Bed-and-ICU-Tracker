import React from 'react';
import { useHospital } from '../context/HospitalContext';
import { API_BASE, WS_URL } from '../services/api';
import { PageHeader, ProgressBar } from '../components/ui';
import { User, Shield, Server, Radio, Key, CheckCircle2, Info } from 'lucide-react';

const rolePermissions = {
  ADMIN: ['Everything, including simulation, audit logs and resource management'],
  DOCTOR: ['View patients', 'Triage', 'Recommend and allocate beds', 'View analytics', 'Discharge patients'],
  NURSE: ['View patients', 'Update patient status', 'Bed operations', 'Cleaning workflow', 'Update ambulances'],
  STAFF: ['Register patients', 'Manage reservations', 'Ambulance operations'],
};

const demoAccounts = [
  { username: 'admin', password: 'admin123', role: 'ADMIN' },
  { username: 'doctor', password: 'doc123', role: 'DOCTOR' },
  { username: 'nurse', password: 'nurse123', role: 'NURSE' },
  { username: 'staff', password: 'staff123', role: 'STAFF' },
];

export default function Settings() {
  const { user, connected, resyncTick } = useHospital();

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Settings" subtitle="Session, permissions and system information" />

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <User size={18} className="text-blue-600" /> Current Session
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500">Username</div>
            <div className="font-semibold text-slate-900">{user?.username}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Full name</div>
            <div className="font-semibold text-slate-900">{user?.fullName || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Role</div>
            <div className="font-semibold text-slate-900">{user?.role}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Hospital</div>
            <div className="font-semibold text-slate-900">{user?.hospitalName || 'Not assigned'}</div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Shield size={18} className="text-blue-600" /> Role Permissions
        </h2>
        <div className="space-y-3">
          {Object.entries(rolePermissions).map(([role, permissions]) => (
            <div key={role} className={`p-3 rounded-xl ${user?.role === role ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-sm text-slate-800">{role}</span>
                {user?.role === role && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">YOUR ROLE</span>
                )}
              </div>
              <ul className="text-xs text-slate-600 space-y-0.5">
                {permissions.map((permission) => (
                  <li key={permission} className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> {permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Permissions are enforced by the backend using Spring Security method annotations. Hiding a button in the UI is not the security boundary.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Server size={18} className="text-blue-600" /> System
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">REST API</span>
            <code className="text-slate-700">{API_BASE}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">WebSocket</span>
            <code className="text-slate-700">{WS_URL}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Reconnect/resync count</span>
            <span className="font-semibold text-slate-800">{resyncTick}</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
            connected ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}">
            <Radio size={16} className={connected ? 'animate-pulse' : ''} />
            {connected ? 'WebSocket connected — live updates active' : 'WebSocket disconnected — retrying automatically'}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            On every successful reconnect the app refetches REST data so no update is missed.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Key size={18} className="text-blue-600" /> Demo Accounts
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Username', 'Password', 'Role'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demoAccounts.map((account) => (
                <tr key={account.username} className={`border-b border-slate-100 ${user?.username === account.username ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-2 text-sm font-mono">{account.username}</td>
                  <td className="px-3 py-2 text-sm font-mono text-slate-600">{account.password}</td>
                  <td className="px-3 py-2 text-sm">{account.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Passwords are stored as BCrypt hashes in MySQL and are never returned by the login API.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Info size={18} className="text-blue-600" /> Demonstration Tips
        </h2>
        <ul className="text-sm text-slate-600 space-y-1.5 list-disc ml-5">
          <li>Open Bed Management in two browser tabs, allocate a bed in one and watch the other update instantly.</li>
          <li>Use the simulation panel on the Command Center to trigger real patients, allocations, discharges and cleaning.</li>
          <li>Reserve a bed then confirm it from Reservations to complete a reservation-to-admission flow.</li>
          <li>Try the same action with two different roles to see backend permission checks reject it.</li>
        </ul>
      </section>
    </div>
  );
}
