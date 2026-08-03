
import React from 'react';
import { AppNotification } from '../types';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface NotificationHubProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationHub: React.FC<NotificationHubProps> = ({ notifications, onDismiss }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="text-red-500" size={20} />;
      case 'success': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-100 bg-red-50';
      case 'success': return 'border-emerald-100 bg-emerald-50';
      case 'warning': return 'border-amber-100 bg-amber-50';
      default: return 'border-blue-100 bg-blue-50';
    }
  };

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+72px)] z-[100] flex flex-col items-center space-y-2 px-4 sm:left-auto sm:right-4 sm:max-w-sm">
      {notifications.map((n) => (
        <div 
          key={n.id}
          role={n.type === 'error' || n.type === 'warning' ? 'alert' : 'status'}
          className={`pointer-events-auto flex w-full max-w-md items-start rounded-xl border p-3 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 ${getBgColor(n.type)}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(n.type)}
          </div>
          <div className="ml-3 flex-1">
            {n.title && <p className="text-sm font-bold text-slate-900 mb-0.5">{n.title}</p>}
            <p className="text-sm text-slate-700 leading-relaxed">{n.message}</p>
          </div>
          <button 
            onClick={() => onDismiss(n.id)}
            aria-label="Cerrar aviso"
            className="-my-2 -mr-2 ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-black/5 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};
