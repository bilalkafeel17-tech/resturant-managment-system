import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newToast = { id, title, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message, title = 'Success') => addToast({ title, message, type: 'success' }),
    error: (message, title = 'Error') => addToast({ title, message, type: 'error', duration: 6000 }),
    info: (message, title = 'Information') => addToast({ title, message, type: 'info' }),
    warning: (message, title = 'Notice') => addToast({ title, message, type: 'warning' }),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let bgClass = 'bg-charcoal-900 text-ivory-100 border-charcoal-800';
          let IconComponent = Info;
          let iconColor = 'text-blue-400';

          if (t.type === 'success') {
            bgClass = 'bg-forest-900 text-ivory-100 border-forest-700 shadow-xl';
            IconComponent = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (t.type === 'error') {
            bgClass = 'bg-rose-900 text-ivory-100 border-rose-700 shadow-xl';
            IconComponent = AlertCircle;
            iconColor = 'text-rose-300';
          } else if (t.type === 'warning') {
            bgClass = 'bg-amber-900 text-ivory-100 border-amber-700 shadow-xl';
            IconComponent = AlertTriangle;
            iconColor = 'text-amber-300';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 animate-slide-up ${bgClass}`}
            >
              <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-sm">
                {t.title && <div className="font-semibold">{t.title}</div>}
                <div className="opacity-90">{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="opacity-70 hover:opacity-100 p-0.5 rounded transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context.toast;
};
