import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useHospital } from '../context/HospitalContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ThemeBackdrop from './ThemeBackdrop';
import BackendBanner from './BackendBanner';
import { CheckCircle2, AlertTriangle, Info, X, XCircle, Siren } from 'lucide-react';

const styles = {
  CRITICAL: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-900', icon: Siren, iconClass: 'text-rose-600', ring: 'animate-alert-pulse' },
  WARNING: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-900', icon: AlertTriangle, iconClass: 'text-amber-600' },
  INFO: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-900', icon: CheckCircle2, iconClass: 'text-blue-600' },
  SUCCESS: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-900', icon: CheckCircle2, iconClass: 'text-emerald-600' },
  ERROR: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-900', icon: XCircle, iconClass: 'text-rose-600' },
};

const defaultStyle = { bg: 'bg-white border-slate-200', text: 'text-slate-800', icon: Info, iconClass: 'text-slate-500' };

function Toasts() {
  const { toasts, dismissToast } = useHospital();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[60] space-y-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const style = styles[toast.type] || defaultStyle;
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            role="status"
            className={`${style.bg} ${style.text} ${style.ring || ''} border rounded-card shadow-panel p-3 flex gap-2.5 items-start animate-toast-in`}
          >
            <Icon size={17} className={`${style.iconClass} shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              {toast.title && <div className="text-[13px] font-extrabold leading-tight">{toast.title}</div>}
              <div className="text-xs leading-snug break-words">{toast.message}</div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function BootScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin" />
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const { user, booting, logout } = useHospital();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  if (booting) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <ThemeBackdrop />
      <div className="cc-no-print">
        <Sidebar />
      </div>
      <div className="pl-60 min-h-screen flex flex-col">
        <div className="cc-no-print">
          <Topbar onLogout={logout} />
        </div>
        <main className="flex-1 px-4 lg:px-6 py-5 lg:py-6 cc-print-full">
          <div className="cc-no-print">
            <BackendBanner />
          </div>
          <div key={location.pathname} className="animate-page-in">
            {children}
          </div>
        </main>
      </div>
      <Toasts />
    </div>
  );
}
