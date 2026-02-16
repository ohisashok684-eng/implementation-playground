import { useState } from 'react';
import { Zap, Pencil, ExternalLink, Link } from 'lucide-react';
import { externalDb } from '@/lib/externalDb';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempProtocol, setTempProtocol] = useState({ title: '', desc: '', fileUrl: '' });

  const openEdit = (p: Protocol) => {
    setEditingId(p.id);
    setTempProtocol({ title: p.title, desc: p.desc, fileUrl: p.fileUrl || '' });
    setIsModalOpen(true);
  };

  const isValidUrl = (url: string) => !url || url.startsWith('http://') || url.startsWith('https://');

  const handleSave = async () => {
    if (!editingId) return;

    if (tempProtocol.fileUrl && !isValidUrl(tempProtocol.fileUrl)) {
      onNotify({ type: 'error', message: 'Ссылка должна начинаться с http:// или https://' });
      return;
    }

    const updateData: Record<string, any> = {
      title: tempProtocol.title,
      description: tempProtocol.desc,
      file_url: tempProtocol.fileUrl || null,
    };

    // Persist to DB
    try {
      await externalDb.update('protocols', updateData, { id: editingId });
    } catch (err) {
      console.error('Failed to persist protocol update:', err);
      onNotify({ type: 'error', message: 'Ошибка сохранения' });
      return;
    }

    // Update local state
    onUpdateProtocols(
      protocols.map((p) => (p.id === editingId ? {
        ...p,
        title: tempProtocol.title,
        desc: tempProtocol.desc,
        fileUrl: tempProtocol.fileUrl || undefined,
      } : p))
    );
    setIsModalOpen(false);
    onNotify({ type: 'success', message: 'Протокол сохранён' });
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
          {p.fileUrl ? (
            <button
              onClick={() => window.open(p.fileUrl!, '_blank')}
              className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-lg bg-foreground text-white"
            >
              <ExternalLink size={14} />
              <span>Открыть файл</span>
            </button>
          ) : (
            <div className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest bg-muted text-muted-foreground cursor-not-allowed">
              <ExternalLink size={14} />
              <span>Файл не прикреплён</span>
            </div>
          )}
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
          <div className="space-y-2">
            <p className="label-tiny">Ссылка на файл</p>
            <div className="flex items-center space-x-2">
              <Link size={16} className="text-muted-foreground shrink-0" />
              <input
                type="url"
                value={tempProtocol.fileUrl}
                onChange={(e) => setTempProtocol({ ...tempProtocol, fileUrl: e.target.value })}
                className="input-glass flex-1"
                placeholder="https://docs.google.com/..."
              />
            </div>
            {tempProtocol.fileUrl && !isValidUrl(tempProtocol.fileUrl) && (
              <p className="text-[10px] text-destructive">Ссылка должна начинаться с http:// или https://</p>
            )}
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