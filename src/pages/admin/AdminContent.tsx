import { useEffect, useState } from 'react';
import { Upload, FileText, Trash2, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ModalOverlay from '@/components/ModalOverlay';

const AdminContent = () => {
  const [users, setUsers] = useState<{ user_id: string; full_name: string; email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);

  // Session form
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    session_number: 1,
    session_date: '',
    session_time: '',
    summary: '',
    steps: [''],
  });

  // Protocol form
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [protocolForm, setProtocolForm] = useState({
    title: '',
    description: '',
    color: 'amber',
    file: null as File | null,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email');
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin');

    const adminIds = new Set(adminRoles?.map(r => r.user_id) ?? []);
    const filtered = (profiles ?? []).filter(p => !adminIds.has(p.user_id));
    setUsers(filtered);
    if (filtered.length > 0) setSelectedUser(filtered[0].user_id);
    setLoading(false);
  };

  const handleAddSession = async () => {
    if (!selectedUser) return;
    setSaving(true);
    await supabase.from('sessions').insert({
      user_id: selectedUser,
      session_number: sessionForm.session_number,
      session_date: sessionForm.session_date,
      session_time: sessionForm.session_time,
      summary: sessionForm.summary,
      steps: sessionForm.steps.filter(s => s.trim()),
    });
    setSaving(false);
    setShowSessionModal(false);
    setSessionForm({ session_number: 1, session_date: '', session_time: '', summary: '', steps: [''] });
  };

  const handleAddProtocol = async () => {
    if (!selectedUser) return;
    setSaving(true);

    let fileUrl = '';
    let fileName = '';

    if (protocolForm.file) {
      fileName = protocolForm.file.name;
      const filePath = `${selectedUser}/${Date.now()}_${fileName}`;
      const { error } = await supabase.storage
        .from('mentoring-files')
        .upload(filePath, protocolForm.file);
      if (!error) {
        const { data } = supabase.storage.from('mentoring-files').getPublicUrl(filePath);
        fileUrl = data.publicUrl;
      }
    }

    await supabase.from('protocols').insert({
      user_id: selectedUser,
      title: protocolForm.title,
      description: protocolForm.description,
      color: protocolForm.color,
      file_name: fileName,
      file_url: fileUrl,
    });

    setSaving(false);
    setShowProtocolModal(false);
    setProtocolForm({ title: '', description: '', color: 'amber', file: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-foreground">Управление контентом</h1>

      {/* User selector */}
      <div className="space-y-2">
        <label className="label-tiny">Клиент</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="input-glass"
        >
          {users.map(u => (
            <option key={u.user_id} value={u.user_id}>
              {u.full_name || u.email}
            </option>
          ))}
        </select>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => setShowSessionModal(true)}
          className="glass card-round p-5 flex items-center space-x-4 text-left hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <FileText size={18} className="text-lime-dark" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Добавить саммари сессии</p>
            <p className="text-[10px] text-muted-foreground">Номер, дата, итоги и шаги</p>
          </div>
        </button>

        <button
          onClick={() => setShowProtocolModal(true)}
          className="glass card-round p-5 flex items-center space-x-4 text-left hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
            <Upload size={18} className="text-secondary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Загрузить протокол</p>
            <p className="text-[10px] text-muted-foreground">Файл и описание протокола</p>
          </div>
        </button>
      </div>

      {/* Session modal */}
      <ModalOverlay isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} title="Саммари сессии">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="label-tiny">Номер</label>
              <input
                type="number"
                value={sessionForm.session_number}
                onChange={e => setSessionForm({ ...sessionForm, session_number: +e.target.value })}
                className="input-glass"
              />
            </div>
            <div className="space-y-2">
              <label className="label-tiny">Дата</label>
              <input
                type="text"
                value={sessionForm.session_date}
                onChange={e => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                className="input-glass"
                placeholder="07 фев"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="label-tiny">Время</label>
            <input
              type="text"
              value={sessionForm.session_time}
              onChange={e => setSessionForm({ ...sessionForm, session_time: e.target.value })}
              className="input-glass"
              placeholder="10:00 – 11:30"
            />
          </div>
          <div className="space-y-2">
            <label className="label-tiny">Саммари</label>
            <textarea
              value={sessionForm.summary}
              onChange={e => setSessionForm({ ...sessionForm, summary: e.target.value })}
              className="input-glass min-h-[80px] resize-none"
              placeholder="Краткое описание сессии..."
            />
          </div>
          <div className="space-y-2">
            <label className="label-tiny">Шаги после сессии</label>
            {sessionForm.steps.map((step, i) => (
              <div key={i} className="flex space-x-2">
                <input
                  type="text"
                  value={step}
                  onChange={e => {
                    const steps = [...sessionForm.steps];
                    steps[i] = e.target.value;
                    setSessionForm({ ...sessionForm, steps });
                  }}
                  className="input-glass flex-1"
                  placeholder={`Шаг ${i + 1}`}
                />
                {sessionForm.steps.length > 1 && (
                  <button onClick={() => {
                    setSessionForm({ ...sessionForm, steps: sessionForm.steps.filter((_, idx) => idx !== i) });
                  }} className="p-2 text-destructive">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setSessionForm({ ...sessionForm, steps: [...sessionForm.steps, ''] })}
              className="flex items-center space-x-1 text-[10px] font-bold text-secondary uppercase tracking-widest"
            >
              <Plus size={12} /> <span>Добавить шаг</span>
            </button>
          </div>
          <button onClick={handleAddSession} disabled={saving} className="w-full py-4 btn-dark disabled:opacity-50">
            {saving ? 'Сохранение...' : 'Сохранить сессию'}
          </button>
        </div>
      </ModalOverlay>

      {/* Protocol modal */}
      <ModalOverlay isOpen={showProtocolModal} onClose={() => setShowProtocolModal(false)} title="Новый протокол">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="label-tiny">Название</label>
            <input
              type="text"
              value={protocolForm.title}
              onChange={e => setProtocolForm({ ...protocolForm, title: e.target.value })}
              className="input-glass"
              placeholder="Рекавери: протокол восстановления"
            />
          </div>
          <div className="space-y-2">
            <label className="label-tiny">Описание</label>
            <textarea
              value={protocolForm.description}
              onChange={e => setProtocolForm({ ...protocolForm, description: e.target.value })}
              className="input-glass min-h-[80px] resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="label-tiny">Цвет</label>
            <div className="flex space-x-2">
              {['amber', 'purple', 'blue', 'rose'].map(c => (
                <button
                  key={c}
                  onClick={() => setProtocolForm({ ...protocolForm, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    protocolForm.color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{
                    backgroundColor: c === 'amber' ? '#f59e0b' : c === 'purple' ? '#8b5cf6' : c === 'blue' ? '#3b82f6' : '#f43f5e',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="label-tiny">Файл</label>
            <input
              type="file"
              onChange={e => setProtocolForm({ ...protocolForm, file: e.target.files?.[0] ?? null })}
              className="text-sm text-muted-foreground"
            />
          </div>
          <button onClick={handleAddProtocol} disabled={saving} className="w-full py-4 btn-dark disabled:opacity-50">
            {saving ? 'Загрузка...' : 'Сохранить протокол'}
          </button>
        </div>
      </ModalOverlay>
    </div>
  );
};

export default AdminContent;
