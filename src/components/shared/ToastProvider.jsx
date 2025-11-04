import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'success', duration = 2500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const toast = { id, message, type };
    setToasts((prev) => [toast, ...prev]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  const value = useMemo(() => ({ show, remove }), [show, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              minWidth: 260,
              maxWidth: 420,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: t.type === 'success' ? '#A7F3D0' : '#FECACA',
              backgroundColor: t.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: t.type === 'success' ? '#065F46' : '#991B1B',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
