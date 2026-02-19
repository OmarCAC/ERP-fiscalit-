
import React, { useEffect } from 'react';
import { Mail, Smartphone, Bell, X, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

export const NotificationToaster: React.FC = () => {
  const { simulatedToasts, removeToast } = useNotification();

  if (simulatedToasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {simulatedToasts.map((toast) => (
        <div 
          key={toast.id} 
          className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 w-80 animate-in slide-in-from-right-10 pointer-events-auto flex gap-4 items-start relative overflow-hidden"
        >
          {/* Channel Icon */}
          <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
              toast.channel === 'SMS' ? 'bg-green-500/20 text-green-400' :
              toast.channel === 'EMAIL' ? 'bg-blue-500/20 text-blue-400' :
              'bg-purple-500/20 text-purple-400'
          }`}>
             {toast.channel === 'SMS' && <Smartphone className="w-5 h-5" />}
             {toast.channel === 'EMAIL' && <Mail className="w-5 h-5" />}
             {toast.channel === 'PUSH' && <Bell className="w-5 h-5" />}
          </div>

          <div className="flex-1 min-w-0">
             <div className="flex justify-between items-start">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
                    Simulation {toast.channel}
                </p>
                <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                </button>
             </div>
             <p className="text-sm font-bold leading-tight mb-1">{toast.message}</p>
             <p className="text-[10px] text-slate-400 truncate">À : {toast.recipient}</p>
          </div>
          
          {/* Progress bar animation */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
              <div className="h-full bg-primary animate-[progress_5s_linear_forwards] w-full origin-left"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
