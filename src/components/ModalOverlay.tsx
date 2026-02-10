import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}

const ModalOverlay = ({ isOpen, onClose, title, children, icon }: ModalOverlayProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in">
      <div className="glass-strong card-round-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon}
            <h2 className="text-xl font-black text-foreground">{title}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2">
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default ModalOverlay;
