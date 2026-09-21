import { useApp } from '../../app/AppContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ToastContainer() {
  const { state, dispatch } = useApp();

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {state.toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto',
            'animate-slide-up backdrop-blur-sm',
            toast.type === 'success' && 'bg-emerald-900/90 border-emerald-700 text-emerald-100',
            toast.type === 'error' && 'bg-red-900/90 border-red-700 text-red-100',
            toast.type === 'warning' && 'bg-amber-900/90 border-amber-700 text-amber-100',
            toast.type === 'info' && 'bg-sky-900/90 border-sky-700 text-sky-100',
          )}
        >
          <span className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle size={16} />}
            {toast.type === 'error' && <XCircle size={16} />}
            {toast.type === 'warning' && <AlertTriangle size={16} />}
            {toast.type === 'info' && <Info size={16} />}
          </span>
          <p className="text-sm flex-1">{toast.message}</p>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
