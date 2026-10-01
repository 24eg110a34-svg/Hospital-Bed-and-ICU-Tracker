import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { analyticsService, errorMessage } from '../services/api';
import useLiveData from '../hooks/useLiveData';
import { PageHeader, Loading, ErrorState, EmptyState, MetricCard } from '../components/ui';
import { BedDouble, Activity, Clock, Users, AlertTriangle, Info } from 'lucide-react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#64748b', '#eab308', '#0f766e'];
const BED_STATUS_COLORS = {
  AVAILABLE: '#10b981',
  RESERVED: '#eab308',
  OCCUPIED: '#ef4444',
  CLEANING: '#f97316',
  MAINTENANCE: '#64748b',
  BLOCKED: '#1e293b',
};
const TRIAGE_COLORS = ['#e11d48', '#f97316', '#f59e0b', '#0ea5e9', '#64748b'];

const toArray = (obj) => Object.entries(obj || {}).map(([name, value]) => ({ name, value }));

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = React.useCallback(async () => {
    try {
      const res = await analyticsService.getAnalytics();
      setData(res.data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to load analytics'));
    } finally {
      setLoading(false);
    }
  }, []);

  useLiveData(load, [], false);

  if (loading) return <Loading label="Computing analytics" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <ErrorState message="No analytics returned" onRetry={load} />;

  const bedStatus = toArray(data.bedStatusDistribution);
  const bedTypes = toArray(data.bedTypeDistribution);
  const triage = toArray(data.triageDistribution);
  const daily = data.dailyActivity || [];
  const occupancy = data.bedOccupancyOverTime || [];
  const icu = data.icuOccupancyOverTime || [];
  const wards = data.wardUtilization || [];
  const resources = data.resourceUtilization || [];
  const availability = data.dataAvailability || {};

  const ChartCard = ({ title, children, note }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
      {note && <p className="text-xs text-slate-500 mb-3">{note}</p>}
      <div className="h-72">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Hospital Analytics" subtitle="Computed from recorded database history only" />

      {!availability.hasLengthOfStayData && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-2">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>{availability.note}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Total Beds" value={data.totalBeds ?? 0} tone="blue" icon={<BedDouble size={16} />} />
        <MetricCard
          label="Occupancy"
          value={`${bedStatus.find((s) => s.name === 'OCCUPIED')?.value ?? 0} beds`}
          tone="red"
          icon={<Activity size={16} />}
        />
        <MetricCard
          label="Avg Wait"
          value={`${(data.averageWaitingMinutes ?? 0).toFixed(0)}m`}
          tone="amber"
          icon={<Clock size={16} />}
        />
        <MetricCard
          label="Avg Stay"
          value={data.averageLengthOfStayHours == null ? 'No data' : `${data.averageLengthOfStayHours.toFixed(1)}h`}
          tone="teal"
        />
        <MetricCard
          label="Turnover /30d"
          value={data.bedTurnoverRate == null ? 'No data' : data.bedTurnoverRate.toFixed(2)}
          tone="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Bed Status Distribution" note="Live count by status">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bedStatus}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {bedStatus.map((entry) => <Cell key={entry.name} fill={BED_STATUS_COLORS[entry.name] || '#3b82f6'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bed Occupancy Over Time" note="Percentage occupied over the last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={occupancy}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={10} tickFormatter={(v) => v.slice(5)} />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip />
              <Area type="monotone" dataKey="occupancy" stroke="#3b82f6" fill="#3b82f633" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ICU Occupancy" note="Critical care utilisation over 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={icu}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={10} tickFormatter={(v) => v.slice(5)} />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="icuOccupancy" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Triage Distribution" note="Patients by triage level">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={triage}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {triage.map((entry, index) => <Cell key={entry.name} fill={TRIAGE_COLORS[index] || '#64748b'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Admissions vs Discharges" note="Last 14 days from recorded timestamps">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={10} tickFormatter={(v) => v.slice(5)} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="admissions" name="Admissions" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="discharges" name="Discharges" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ambulance Arrivals" note="Scheduled arrivals per day">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={10} tickFormatter={(v) => v.slice(5)} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="ambulanceArrivals" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ward Utilization" note="Occupied beds as a share of ward capacity">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wards} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} unit="%" fontSize={11} />
              <YAxis type="category" dataKey="wardType" width={90} fontSize={11} />
              <Tooltip />
              <Bar dataKey="utilization" fill="#0f766e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bed Type Mix" note="Capacity by bed type">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={bedTypes} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {bedTypes.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-3">Resource Utilization</h3>
        {resources.length === 0 ? <EmptyState title="No resource data" /> : (
          <div className="space-y-3">
            {resources.map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <span className="w-48 shrink-0 text-sm text-slate-700 truncate">{r.name}</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${r.utilization > 75 ? 'bg-rose-500' : r.utilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, r.utilization || 0)}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-xs text-slate-500 text-right">
                  {r.used}/{r.total} ({r.utilization}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
