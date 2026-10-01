import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  bedService, wardService, patientService, reservationService, errorMessage,
} from '../services/api';
import { useHospital } from '../context/HospitalContext';
import useLiveData from '../hooks/useLiveData';
import BedCard from '../components/BedCard';
import Modal from '../components/Modal';
import { PageHeader, Loading, ErrorState, EmptyState } from '../components/ui';
import { BED_STATUSES, BED_TYPES, formatDateTime } from '../utils/constants';
import { Search, BedDouble, RefreshCw, Info, CheckCircle, XCircle, Zap, CalendarClock, Wrench, Check } from 'lucide-react';

export default function BedManagement() {
  const { can, pushToast } = useHospital();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get('patientId');

  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [modalBed, setModalBed] = useState(null);
  const [modalMode, setModalMode] = useState('allocate');
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatient || '');
  const [eligibility, setEligibility] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [bedRes, wardRes, patientRes] = await Promise.all([
        bedService.getAll(),
        wardService.getAll(),
        patientService.getWaiting(),
      ]);
      setBeds(bedRes.data || []);
      setWards(wardRes.data || []);
      setPatients(patientRes.data || []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load beds'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(load);

  useEffect(() => {
    if (preselectedPatient) {
      setSelectedPatientId(preselectedPatient);
      setModalMode('allocate');
    }
  }, [preselectedPatient]);

  const checkEligibility = useCallback(async (patientId) => {
    if (!patientId) { setEligibility(null); return; }
    setEligibilityLoading(true);
    try {
      const { data } = await bedService.eligibility(patientId);
      setEligibility(data);
    } catch (err) {
      setEligibility(null);
      pushToast(errorMessage(err, 'Eligibility check failed'), 'ERROR');
    } finally {
      setEligibilityLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (modalBed && selectedPatientId) checkEligibility(selectedPatientId);
  }, [modalBed, selectedPatientId, checkEligibility]);

  const filtered = beds.filter((bed) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || bed.bedNumber.toLowerCase().includes(q)
      || (bed.wardName || '').toLowerCase().includes(q)
      || (bed.currentPatientName || '').toLowerCase().includes(q)
      || (bed.room || '').toLowerCase().includes(q);
    const matchWard = wardFilter === 'ALL' || String(bed.wardId) === wardFilter;
    const matchStatus = statusFilter === 'ALL' || bed.status === statusFilter;
    const matchType = typeFilter === 'ALL' || bed.bedType === typeFilter;
    return matchSearch && matchWard && matchStatus && matchType;
  });

  const grouped = filtered.reduce((acc, bed) => {
    const key = bed.wardName || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(bed);
    return acc;
  }, {});

  const openModal = (bed, mode) => {
    setModalBed(bed);
    setModalMode(mode);
    setEligibility(null);
  };

  const closeModal = () => {
    setModalBed(null);
    setEligibility(null);
    setSelectedPatientId(preselectedPatient || '');
  };

  const bedEligibility = eligibility?.allBeds?.find((b) => b.bedId === modalBed?.id);
  const recommended = eligibility?.recommendedBed ?? null;

  const submit = async () => {
    if (!modalBed || !selectedPatientId) return;
    setBusy(true);
    try {
      if (modalMode === 'reserve') {
        await reservationService.reserve(modalBed.id, selectedPatientId);
        pushToast(`Bed ${modalBed.bedNumber} reserved for 2 hours`, 'SUCCESS', 'Reservation created');
      } else {
        await bedService.allocate(selectedPatientId, modalBed.id);
        pushToast(`Bed ${modalBed.bedNumber} allocated`, 'SUCCESS', 'Allocation complete');
      }
      closeModal();
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Operation failed'), 'ERROR', 'Action rejected');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (bed, status) => {
    if (!window.confirm(`Change bed ${bed.bedNumber} from ${bed.status} to ${status}?`)) return;
    try {
      await bedService.updateStatus(bed.id, status);
      pushToast(`Bed ${bed.bedNumber} is now ${status}`, 'SUCCESS');
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Status change rejected'), 'ERROR');
    }
  };

  const markAvailable = async (bed) => {
    try {
      await bedService.markAvailable(bed.id);
      pushToast(`Bed ${bed.bedNumber} is now available`, 'SUCCESS');
      load();
    } catch (err) {
      pushToast(errorMessage(err, 'Could not mark available'), 'ERROR');
    }
  };

  if (loading) return <Loading label="Loading beds" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const canAllocate = can('ADMIN', 'DOCTOR');
  const canReserve = can('ADMIN', 'DOCTOR', 'STAFF');
  const canBedOps = can('ADMIN', 'NURSE');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bed Management"
        subtitle={`${beds.length} beds across ${wards.length} wards — live database status`}
        actions={(
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        )}
      />

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {BED_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'ALL' : status)}
            className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
              statusFilter === status ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="text-lg font-bold text-slate-900">{beds.filter((b) => b.status === status).length}</div>
            <div className="text-[10px] font-semibold text-slate-500">{status}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bed, ward, room or patient..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm">
          <option value="ALL">All wards</option>
          {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm">
          <option value="ALL">All types</option>
          {BED_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {statusFilter !== 'ALL' && (
          <button onClick={() => setStatusFilter('ALL')} className="px-3 py-2.5 text-sm text-blue-600 hover:underline cursor-pointer">
            Clear status filter
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState icon={<BedDouble size={48} />} title="No beds match your filters" hint="Try clearing the ward, type or status filter" />
        </div>
      ) : (
        Object.entries(grouped).map(([wardName, wardBeds]) => (
          <section key={wardName}>
            <div className="flex justify-between items-baseline mb-3">
              <h2 className="font-bold text-slate-800">{wardName}</h2>
              <span className="text-xs text-slate-500">
                {wardBeds.filter((b) => b.status === 'AVAILABLE').length} available of {wardBeds.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3">
              {wardBeds.map((bed) => (
                <BedCard
                  key={bed.id}
                  bed={bed}
                  actions={(
                    <>
                      {bed.status === 'AVAILABLE' && canAllocate && (
                        <button onClick={() => openModal(bed, 'allocate')} className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 cursor-pointer">
                          Allocate
                        </button>
                      )}
                      {bed.status === 'AVAILABLE' && canReserve && (
                        <button onClick={() => openModal(bed, 'reserve')} className="px-2 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 cursor-pointer">
                          Reserve
                        </button>
                      )}
                      {['CLEANING', 'MAINTENANCE'].includes(bed.status) && canBedOps && (
                        <button onClick={() => markAvailable(bed)} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 cursor-pointer">
                          Mark Available
                        </button>
                      )}
                      {bed.status === 'AVAILABLE' && canBedOps && (
                        <button onClick={() => changeStatus(bed, 'MAINTENANCE')} className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 cursor-pointer">
                          <Wrench size={11} className="inline mr-1" />Maintenance
                        </button>
                      )}
                      {bed.status === 'AVAILABLE' && canBedOps && (
                        <button onClick={() => changeStatus(bed, 'BLOCKED')} className="px-2 py-1 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900 cursor-pointer">
                          Block
                        </button>
                      )}
                      {bed.status === 'BLOCKED' && canBedOps && (
                        <button onClick={() => changeStatus(bed, 'AVAILABLE')} className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer">
                          Unblock
                        </button>
                      )}
                      {bed.status === 'RESERVED' && canReserve && (
                        <span className="px-2 py-1 text-xs text-slate-500">Awaiting confirmation</span>
                      )}
                    </>
                  )}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <Modal isOpen={Boolean(modalBed)} onClose={closeModal} title={modalMode === 'reserve' ? 'Reserve Bed' : 'Allocate Bed'} size="lg">
        {modalBed && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-bold text-slate-900">{modalBed.bedNumber}</div>
                  <div className="text-xs text-slate-500">
                    {modalBed.wardName} · {modalBed.bedType} · {modalBed.features}
                  </div>
                </div>
                {eligibility && modalBed && (
                  bedEligibility && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      bedEligibility.eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {bedEligibility.eligible ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {bedEligibility.eligible ? 'ELIGIBLE' : 'NOT SUITABLE'}
                    </span>
                  )
                )}
              </div>
              {bedEligibility && (
                <div className={`mt-2 flex items-start gap-2 text-xs p-2 rounded-lg ${
                  bedEligibility.eligible ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                }`}>
                  <Info size={13} className="mt-0.5 shrink-0" />
                  <span>{bedEligibility.reason}</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex gap-2 mb-3">
                {canAllocate && (
                  <button
                    onClick={() => setModalMode('allocate')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${modalMode === 'allocate' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    Allocate Now
                  </button>
                )}
                {canReserve && (
                  <button
                    onClick={() => setModalMode('reserve')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${modalMode === 'reserve' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    Reserve 2 Hours
                  </button>
                )}
              </div>

              <label className="block text-sm font-medium text-slate-700 mb-1">Select waiting patient</label>
              {patients.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-500 text-center">
                  No patients are currently waiting for a bed.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {patients.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        String(p.id) === String(selectedPatientId) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="patient"
                        checked={String(p.id) === String(selectedPatientId)}
                        onChange={() => setSelectedPatientId(String(p.id))}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-sm text-slate-800">{p.fullName}</span>
                          <span className="text-xs font-bold text-slate-500 shrink-0">L{p.triageLevel}</span>
                        </div>
                        <div className="text-xs text-slate-500">{p.age} yrs · {p.gender} · {p.medicalRecordNumber}</div>
                        <div className="text-xs text-slate-400 truncate">{p.chiefComplaint}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Requires: {p.requiredBedType || 'GENERAL'}
                          {p.requiredWardType ? ` · ${p.requiredWardType} ward` : ''} · {p.requiredEquipmentSummary}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {eligibilityLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" /> Checking eligibility...
              </div>
            )}

            {eligibility && !eligibilityLoading && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Eligible beds</span>
                  <span className="font-bold text-slate-900">{eligibility.eligibleBedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Recommended</span>
                  <span className="font-bold text-emerald-700">
                    {eligibility.recommendedBedNumber || 'None available'}
                  </span>
                </div>
                {recommended && recommended !== modalBed.id && (
                  <button
                    onClick={() => {
                      const target = beds.find((b) => b.id === recommended);
                      if (target) { setModalBed(target); }
                    }}
                    className="mt-2 text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    <Zap size={11} className="inline mr-1" />Use recommended bed instead
                  </button>
                )}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!selectedPatientId || busy || (bedEligibility && !bedEligibility.eligible)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {busy ? 'Processing...' : modalMode === 'reserve' ? 'Reserve Bed for 2 Hours' : 'Allocate Bed'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
