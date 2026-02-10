import { CheckCircle2, AlertCircle } from 'lucide-react';

interface NotificationToastProps {
  notification: { type: 'success' | 'error'; message: string } | null;
}

const NotificationToast = ({ notification }: NotificationToastProps) => {
  if (!notification) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[800] px-6 py-4 glass-strong card-round flex items-center space-x-3 animate-in">
      {notification.type === 'success' ? (
        <CheckCircle2 size={18} className="text-lime-dark" />
      ) : (
        <AlertCircle size={18} className="text-destructive" />
      )}
      <span className="text-sm font-semibold text-foreground">{notification.message}</span>
    </div>
  );
};

export default NotificationToast;
