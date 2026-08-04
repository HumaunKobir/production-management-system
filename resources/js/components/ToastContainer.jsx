import { useToast } from '../context/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <span>{t.message}</span>
          <button type="button" className="toast-close" onClick={() => removeToast(t.id)} aria-label="Close">×</button>
        </div>
      ))}
    </div>
  );
}
