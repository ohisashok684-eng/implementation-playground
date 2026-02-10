import { useState, useRef } from 'react';
import { Zap, Pencil, ExternalLink, FileText, Upload } from 'lucide-react';
import ModalOverlay from '@/components/ModalOverlay';
import type { Protocol } from '@/types/mentoring';

interface ProtocolsTabProps {
  protocols: Protocol[];
  onUpdateProtocols: (protocols: Protocol[]) => void;
  onNotify: (notification: { type: 'success' | 'error'; message: string }) => void;
}

const colorMap: Record<string, string> = {
  amber: 'text-amber-500',
  purple: 'text-purple-500',
  blue: 'text-blue-500',
};

const ProtocolsTab = ({ protocols, onUpdateProtocols, onNotify }: ProtocolsTabProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempProtocol, setTempProtocol] = useState({ title: '', desc: '', fileName: '' });

  const openEdit = (p: Protocol) => {
    setEditingId(p.id);
    setTempProtocol({ title: p.title, desc: p.desc, fileName: p.fileName || '' });
    setIsModalOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTempProtocol((prev) => ({ ...prev, fileName: file.name }));
    }
  };

  const handleSave = () => {
    onUpdateProtocols(
      protocols.map((p) => (p.id === editingId ? { ...p, ...tempProtocol } : p))
    );
    setIsModalOpen(false);
  };

  const handleOpenFile = (fileName: string) => {
    if (!fileName) {
      onNotify({ type: 'error', message: 'К этому протоколу не прикреплен файл' });
      return;
    }
    onNotify({ type: 'success', message: `Открываем файл «${fileName}»...` });
  };

  return (
    <div className="space-y-4 animate-in">
      <h2 className="text-xl font-black text-foreground">Протоколы</h2>

      {protocols.map((p) => (
        <div key={p.id} className="glass card-round-lg p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Zap size={24} className={colorMap[p.color] || 'text-muted-foreground'} />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground leading-tight">{p.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</p>
              </div>
            </div>
            <button
              onClick={() => openEdit(p)}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-secondary transition-colors shrink-0"
            >
              <Pencil size={14} />
            </button>
          </div>
          <button
            onClick={() => handleOpenFile(p.fileName)}
            className={`w-full flex items-center justify-center space-x-2 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-lg ${
              p.fileName
                ? 'bg-foreground text-white'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <ExternalLink size={14} />
            <span>Открыть файл</span>
          </button>
        </div>
      ))}

      {/* Edit Protocol Modal */}
      <ModalOverlay
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Правка протокола"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="label-tiny">Название</p>
            <input
              type="text"
              value={tempProtocol.title}
              onChange={(e) => setTempProtocol({ ...tempProtocol, title: e.target.value })}
              className="input-glass"
            />
          </div>
          <div className="space-y-2">
            <p className="label-tiny">Описание</p>
            <textarea
              value={tempProtocol.desc}
              onChange={(e) => setTempProtocol({ ...tempProtocol, desc: e.target.value })}
              rows={3}
              className="input-glass resize-none"
            />
          </div>
          <div className="space-y-3 pt-2">
            <p className="label-tiny">Файл протокола</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx"
            />
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-muted border-dashed group transition-all">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 bg-card rounded-xl text-muted-foreground shadow-sm shrink-0">
                  <FileText size={18} />
                </div>
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {tempProtocol.fileName || 'Файл не выбран'}
                </span>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-card rounded-xl text-secondary hover:bg-purple-light shadow-sm transition-all active:scale-90"
              >
                <Upload size={18} />
              </button>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 btn-outline-dark"
            >
              Загрузить файл
            </button>
          </div>
          <button onClick={handleSave} className="w-full py-5 btn-dark mt-4">
            Сохранить изменения
          </button>
        </div>
      </ModalOverlay>
    </div>
  );
};

export default ProtocolsTab;
