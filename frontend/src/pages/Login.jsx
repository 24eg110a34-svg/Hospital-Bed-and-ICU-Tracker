import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '../context/HospitalContext';
import { errorMessage } from '../services/api';
import CinematicHero from '../components/CinematicHero';
import { Activity, User, Lock, AlertCircle, ShieldCheck, Radio } from 'lucide-react';

const demoAccounts = [
  { username: 'admin', password: 'admin123', role: 'ADMIN' },
  { username: 'doctor', password: 'doc123', role: 'DOCTOR' },
  { username: 'nurse', password: 'nurse123', role: 'NURSE' },
  { username: 'staff', password: 'staff123', role: 'STAFF' },
];

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useHospital();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Unable to sign in'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CinematicHero className="min-h-screen">
      <div className="min-h-screen w-full max-w-6xl mx-auto px-4 py-8 lg:py-10 grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <section className="hidden lg:block text-white">
          <span className="cc-indicator">
            <Radio size={11} /> REAL-TIME BED INTELLIGENCE
          </span>
          <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight">
            Every bed,
            <br />
            <span className="bg-gradient-to-r from-sky-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
              accounted for.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-sky-100/70 text-[15px] leading-relaxed">
            Live occupancy across wards and ICU, triage queue priority, and bed allocation in one command
            center. Calm under pressure, because the state is always real.
          </p>
          <ul className="mt-7 space-y-2.5 text-[13px] text-sky-100/80">
            {['Ward floor map with live status', 'Triage queue ranked by acuity', 'ICU, HDU and fleet telemetry'].map((line) => (
              <li key={line} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cc-dot-ping text-emerald-400" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-panel border border-white/60 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center">
                <Activity className="text-white" size={22} />
              </div>
              <div>
                <h1 className="font-black text-slate-900 tracking-tight">BEDTRACKER</h1>
                <p className="text-xs text-slate-500 font-medium">Hospital Command Center</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h2>
            <p className="text-sm text-slate-500 mb-6">Authenticate with your hospital staff account.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-200/70 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
              Role-based access · audit logged · WebSocket secured
            </div>
          </div>

          <div className="mt-4 bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/60">
            <p className="text-xs font-semibold text-slate-400 mb-2">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => { setUsername(account.username); setPassword(account.password); }}
                  className="text-left px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 transition-colors cursor-pointer"
                >
                  <div className="text-xs font-mono text-white">{account.username}</div>
                  <div className="text-[11px] text-slate-400">{account.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CinematicHero>
  );
}
