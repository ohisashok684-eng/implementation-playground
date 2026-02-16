import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Map, FileText, Zap, Plus, Trash2, X, Link, Check, Edit2, MessageSquare, Rocket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { externalDb } from '@/lib/externalDb';

import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ModalOverlay from '@/components/ModalOverlay';

const AdminClientView = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [volcanoes, setVolcanoes] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [trackingQuestions, setTrackingQuestions] = useState<any[]>([]);
  const [pointBQuestions, setPointBQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [showRoadmapForm, setShowRoadmapForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showPointBForm, setShowPointBForm] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<string | null>(null);

  // Editing IDs (null = create mode)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);
  const [editingRoadmapId, setEditingRoadmapId] = useState<string | null>(null);

  // Session form
  const [sessionForm, setSessionForm] = useState({
    session_number: 1, session_date: '', session_time: '', summary: '', steps: [''], file_urls: [] as string[]
  });

  // Protocol form
  const [protocolForm, setProtocolForm] = useState({
    title: '', description: '', color: 'amber', file_url: ''
  });

  // Roadmap form
  const [roadmapForm, setRoadmapForm] = useState({
    title: '', description: '', status: 'В работе', steps: [''] as string[], file_url: ''
  });

  // Question form
  const [questionForm, setQuestionForm] = useState({
    question_type: 'daily' as 'daily' | 'weekly',
    question_text: '',
    field_type: 'text'
  });

  // Editing question
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');

  // Point B question form
  const [pointBFormText, setPointBFormText] = useState('');
  const [editingPBId, setEditingPBId] = useState<string | null>(null);
  const [editingPBText, setEditingPBText] = useState('');

  useEffect(() => {
    if (userId) loadClientData(userId);
  }, [userId]);

  const loadClientData = async (uid: string) => {
    try {
      const [profileRes, goalsRes, roadmapsRes, sessionsRes, protocolsRes, diaryRes, volcanoesRes, metricsRes, questionsRes, pbQuestionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle(),
        externalDb.admin.select('goals', { filters: { user_id: uid }, order: { column: 'created_at' } }),
        externalDb.admin.select('roadmaps', { filters: { user_id: uid }, order: { column: 'created_at' }, withSteps: true }),
        externalDb.admin.select('sessions', { filters: { user_id: uid }, order: { column: 'session_number', ascending: false } }),
        externalDb.admin.select('protocols', { filters: { user_id: uid }, order: { column: 'created_at' } }),
        externalDb.admin.select('diary_entries', { filters: { user_id: uid }, order: { column: 'created_at', ascending: false } }),
        externalDb.admin.select('volcanoes', { filters: { user_id: uid } }),
        externalDb.admin.select('progress_metrics', { filters: { user_id: uid } }),
        externalDb.admin.select('tracking_questions', { filters: { user_id: uid }, order: { column: 'sort_order' } }),
        externalDb.admin.select('point_b_questions', { filters: { user_id: uid }, order: { column: 'sort_order' } }),
      ]);

      setProfile(profileRes.data || null);
      setGoals(goalsRes.data ?? []);
      setRoadmaps(roadmapsRes.data ?? []);
      setSessions(sessionsRes.data ?? []);
      setProtocols(protocolsRes.data ?? []);
      setDiaryEntries(diaryRes.data ?? []);
      setVolcanoes(volcanoesRes.data ?? []);
      setMetrics(metricsRes.data ?? []);
      setTrackingQuestions(questionsRes.data ?? []);
      setPointBQuestions(pbQuestionsRes.data ?? []);
      setLoading(false);

      // Pre-fill session number
      const maxNum = (sessionsRes.data ?? []).reduce((max: number, s: any) => Math.max(max, s.session_number), 0);
      setSessionForm(prev => ({ ...prev, session_number: maxNum + 1 }));
    } catch (err) {
      console.error('Failed to load client data:', err);
      setLoading(false);
    }
  };

  // === SESSIONS ===
  const openEditSession = (s: any) => {
    setEditingSessionId(s.id);
    setSessionForm({
      session_number: s.session_number,
      session_date: s.session_date,
      session_time: s.session_time,
      summary: s.summary || '',
      steps: s.steps?.length > 0 ? [...s.steps] : [''],
      file_urls: [],
    });
    setShowSessionForm(true);
  };

  const openCreateSession = () => {
    setEditingSessionId(null);
    const maxNum = sessions.reduce((max: number, s: any) => Math.max(max, s.session_number), 0);
    setSessionForm({ session_number: maxNum + 1, session_date: '', session_time: '', summary: '', steps: [''], file_urls: [] });
    setShowSessionForm(true);
  };

  const isValidUrl = (url: string) => !url || url.startsWith('http://') || url.startsWith('https://');

  const handleSaveSession = async () => {
    if (!userId) return;

    // Validate URLs
    const validUrls = sessionForm.file_urls.filter(u => u.trim());
    for (const url of validUrls) {
      if (!isValidUrl(url)) {
        toast({ title: 'Ошибка', description: 'Все ссылки должны начинаться с http:// или https://', variant: 'destructive' });
        return;
      }
    }

    try {
      if (editingSessionId) {
        const existingSession = sessions.find(s => s.id === editingSessionId);
        const existingFiles = existingSession?.files || [];
        await externalDb.admin.update('sessions', {
          session_number: sessionForm.session_number,
          session_date: sessionForm.session_date,
          session_time: sessionForm.session_time,
          summary: sessionForm.summary,
          steps: sessionForm.steps.filter(s => s.trim()),
          files: [...existingFiles, ...validUrls],
        }, { id: editingSessionId });
        toast({ title: 'Сессия обновлена' });
      } else {
        await externalDb.admin.insert('sessions', {
          user_id: userId,
          session_number: sessionForm.session_number,
          session_date: sessionForm.session_date,
          session_time: sessionForm.session_time,
          summary: sessionForm.summary,
          steps: sessionForm.steps.filter(s => s.trim()),
          files: validUrls,
        });
        toast({ title: 'Сессия добавлена' });
      }
      setShowSessionForm(false);
      setEditingSessionId(null);
      setSessionForm(prev => ({ ...prev, file_urls: [] }));
      loadClientData(userId);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  // === PROTOCOLS ===
  const openEditProtocol = (p: any) => {
    setEditingProtocolId(p.id);
    setProtocolForm({
      title: p.title,
      description: p.description || '',
      color: p.color || 'amber',
      file_url: p.file_url || '',
    });
    setShowProtocolForm(true);
  };

  const openCreateProtocol = () => {
    setEditingProtocolId(null);
    setProtocolForm({ title: '', description: '', color: 'amber', file_url: '' });
    setShowProtocolForm(true);
  };

  const handleSaveProtocol = async () => {
    if (!userId) return;

    if (protocolForm.file_url && !isValidUrl(protocolForm.file_url)) {
      toast({ title: 'Ошибка', description: 'Ссылка должна начинаться с http:// или https://', variant: 'destructive' });
      return;
    }

    try {
      if (editingProtocolId) {
        await externalDb.admin.update('protocols', {
          title: protocolForm.title,
          description: protocolForm.description,
          color: protocolForm.color,
          file_url: protocolForm.file_url || null,
        }, { id: editingProtocolId });
        toast({ title: 'Протокол обновлён' });
      } else {
        await externalDb.admin.insert('protocols', {
          user_id: userId,
          title: protocolForm.title,
          description: protocolForm.description,
          color: protocolForm.color,
          file_url: protocolForm.file_url || null,
        });
        toast({ title: 'Протокол добавлен' });
      }
      setShowProtocolForm(false);
      setEditingProtocolId(null);
      setProtocolForm({ title: '', description: '', color: 'amber', file_url: '' });
      loadClientData(userId);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  // === ROADMAPS ===
  const openEditRoadmapMeta = (r: any) => {
    setEditingRoadmapId(r.id);
    setRoadmapForm({
      title: r.title,
      description: r.description || '',
      status: r.status || 'В работе',
      steps: [''],
      file_url: r.file_url || '',
    });
    setShowRoadmapForm(true);
  };

  const openCreateRoadmap = () => {
    setEditingRoadmapId(null);
    setRoadmapForm({ title: '', description: '', status: 'В работе', steps: [''], file_url: '' });
    setShowRoadmapForm(true);
  };

  const handleSaveRoadmap = async () => {
    if (!userId) return;

    if (roadmapForm.file_url && !isValidUrl(roadmapForm.file_url)) {
      toast({ title: 'Ошибка', description: 'Ссылка должна начинаться с http:// или https://', variant: 'destructive' });
      return;
    }

    try {
      if (editingRoadmapId) {
        await externalDb.admin.update('roadmaps', {
          title: roadmapForm.title,
          description: roadmapForm.description,
          status: roadmapForm.status,
          file_url: roadmapForm.file_url || null,
        }, { id: editingRoadmapId });
        toast({ title: 'Дорожная карта обновлена' });
      } else {
        const res = await externalDb.admin.insert('roadmaps', {
          user_id: userId,
          title: roadmapForm.title,
          description: roadmapForm.description,
          status: roadmapForm.status,
          file_url: roadmapForm.file_url || null,
        });

        // Insert steps
        const steps = roadmapForm.steps.filter(s => s.trim());
        if (steps.length > 0 && res.data) {
          for (let i = 0; i < steps.length; i++) {
            await externalDb.admin.insert('roadmap_steps', {
              roadmap_id: res.data.id,
              text: steps[i],
              sort_order: i,
            });
          }
        }
        toast({ title: 'Дорожная карта создана' });
      }
      setShowRoadmapForm(false);
      setEditingRoadmapId(null);
      setRoadmapForm({ title: '', description: '', status: 'В работе', steps: [''], file_url: '' });
      loadClientData(userId!);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddStep = async (roadmapId: string) => {
    const maxOrder = roadmaps.find(r => r.id === roadmapId)?.roadmap_steps?.length || 0;
    try {
      await externalDb.admin.insert('roadmap_steps', {
        roadmap_id: roadmapId,
        text: 'Новый шаг',
        sort_order: maxOrder,
      });
      loadClientData(userId!);
    } catch (err) {
      console.error('Failed to add step:', err);
    }
  };

  const handleUpdateStep = async (stepId: string, updates: any) => {
    try {
      await externalDb.admin.update('roadmap_steps', updates, { id: stepId });
      loadClientData(userId!);
    } catch (err) {
      console.error('Failed to update step:', err);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      await externalDb.admin.delete('roadmap_steps', { id: stepId });
      loadClientData(userId!);
    } catch (err) {
      console.error('Failed to delete step:', err);
    }
  };


  // === TRACKING QUESTIONS ===
  const handleSaveQuestion = async () => {
    if (!userId) return;
    const maxOrder = trackingQuestions.filter(q => q.question_type === questionForm.question_type).length;
    try {
      await externalDb.admin.insert('tracking_questions', {
        user_id: userId,
        question_type: questionForm.question_type,
        question_text: questionForm.question_text,
        field_type: questionForm.field_type,
        sort_order: maxOrder,
      });
      toast({ title: 'Вопрос добавлен' });
      setShowQuestionForm(false);
      setQuestionForm({ question_type: 'daily', question_text: '', field_type: 'text' });
      loadClientData(userId);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateQuestion = async (id: string, text: string) => {
    try {
      await externalDb.admin.update('tracking_questions', { question_text: text }, { id });
      setEditingQuestionId(null);
      loadClientData(userId!);
    } catch (err) {
      console.error('Failed to update question:', err);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await externalDb.admin.delete('tracking_questions', { id });
      loadClientData(userId!);
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  // === POINT B QUESTIONS ===
  const handleSavePointBQuestion = async () => {
    if (!userId || !pointBFormText.trim()) return;
    const maxOrder = pointBQuestions.length;
    try {
      await externalDb.admin.insert('point_b_questions', {
        user_id: userId,
        question_text: pointBFormText.trim(),
        sort_order: maxOrder,
      });
      toast({ title: 'Вопрос добавлен' });
      setShowPointBForm(false);
      setPointBFormText('');
      loadClientData(userId);
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdatePBQuestion = async (id: string, text: string) => {
    try {
      await externalDb.admin.update('point_b_questions', { question_text: text }, { id });
      setEditingPBId(null);
      loadClientData(userId!);
    } catch (err) {
      console.error('Failed to update PB question:', err);
    }
  };

  const handleDeletePBQuestion = async (id: string) => {
    try {
      await externalDb.admin.delete('point_b_questions', { id });
      loadClientData(userId!);
    } catch (err) {
      console.error('Failed to delete PB question:', err);
    }
  };

  // === DELETE HANDLERS ===
  const handleDeleteSession = async (id: string) => {
    try {
      await externalDb.admin.delete('sessions', { id });
      toast({ title: 'Сессия удалена' });
      loadClientData(userId!);
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteProtocol = async (id: string) => {
    try {
      await externalDb.admin.delete('protocols', { id });
      toast({ title: 'Протокол удалён' });
      loadClientData(userId!);
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteRoadmap = async (id: string) => {
    try {
      const roadmap = roadmaps.find(r => r.id === id);
      if (roadmap?.roadmap_steps) {
        for (const step of roadmap.roadmap_steps) {
          await externalDb.admin.delete('roadmap_steps', { id: step.id });
        }
      }
      await externalDb.admin.delete('roadmaps', { id });
      toast({ title: 'Дорожная карта удалена' });
      loadClientData(userId!);
    } catch (err: any) {
      toast({ title: 'Ошибка', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center text-muted-foreground py-10">Клиент не найден</p>;
  }

  const Section = ({ title, icon: Icon, action, children }: { title: string; icon: any; action?: React.ReactNode; children: React.ReactNode }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon size={16} className="text-secondary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );

   const AddButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
     <button onClick={onClick} className="flex items-center space-x-1 text-[10px] font-bold text-secondary uppercase tracking-wider hover:text-secondary/80 transition-colors">
      <Plus size={14} />
      <span>{label}</span>
    </button>
  );

  const dailyQuestions = trackingQuestions.filter(q => q.question_type === 'daily');
  const weeklyQuestions = trackingQuestions.filter(q => q.question_type === 'weekly');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground">{profile.full_name || profile.email}</h1>
          <p className="text-xs text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      {/* ========== GOALS (read-only) ========== */}
      <Section title="Цели клиента" icon={Target}>
        {goals.length === 0 ? (
          <p className="text-xs text-muted-foreground">Целей пока нет</p>
        ) : (
          goals.map((g) => (
            <div key={g.id} className="glass card-round p-3 space-y-1">
              <p className="text-sm font-bold text-foreground">{g.title}</p>
              {g.has_amount && <p className="text-xs text-muted-foreground">Цель: {g.amount} ₽</p>}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${g.progress}%` }} />
              </div>
            </div>
          ))
        )}
      </Section>

      {/* ========== SESSIONS ========== */}
      <Section title="Сессии" icon={FileText} action={<AddButton onClick={openCreateSession} label="Добавить" />}>
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Сессий нет</p>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="glass card-round p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Сессия {s.session_number}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-muted-foreground">{s.session_date} · {s.session_time}</span>
                  <button onClick={() => openEditSession(s)} className="text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteSession(s.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-xs text-foreground">{s.summary}</p>
              {s.steps?.length > 0 && (
                <div className="space-y-1 pt-1">
                  {s.steps.map((step: string, i: number) => (
                    <p key={i} className="text-[10px] text-muted-foreground">• {step}</p>
                  ))}
                </div>
              )}
              {s.files?.length > 0 && (
                <div className="space-y-1 pt-1">
                  {s.files.map((fileUrl: string, i: number) => (
                    <button key={i} onClick={() => window.open(fileUrl, '_blank')} className="text-[10px] text-secondary font-medium underline block cursor-pointer bg-transparent border-none p-0">
                      🔗 Ссылка {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </Section>

      {/* Session Form Modal (create + edit) */}
      <ModalOverlay
        isOpen={showSessionForm}
        onClose={() => { setShowSessionForm(false); setEditingSessionId(null); }}
        title={editingSessionId ? 'Редактировать сессию' : 'Новая сессия'}
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <p className="label-tiny">Номер</p>
            <input type="number" value={sessionForm.session_number} onChange={e => setSessionForm({...sessionForm, session_number: +e.target.value})} className="input-glass text-center" />
          </div>
          <div className="space-y-1">
            <p className="label-tiny">Дата</p>
            <input type="date" value={sessionForm.session_date} onChange={e => setSessionForm({...sessionForm, session_date: e.target.value})} className="input-glass text-xs" />
          </div>
          <div className="space-y-1">
            <p className="label-tiny">Время</p>
            <input type="time" value={sessionForm.session_time} onChange={e => setSessionForm({...sessionForm, session_time: e.target.value})} className="input-glass text-xs" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="label-tiny">Саммари</p>
          <textarea value={sessionForm.summary} onChange={e => setSessionForm({...sessionForm, summary: e.target.value})} rows={3} className="input-glass resize-none" placeholder="Ключевые выводы сессии..." />
        </div>
        <div className="space-y-2">
          <p className="label-tiny">Шаги после сессии</p>
          {sessionForm.steps.map((step, i) => (
            <div key={i} className="flex space-x-2">
              <input value={step} onChange={e => { const s = [...sessionForm.steps]; s[i] = e.target.value; setSessionForm({...sessionForm, steps: s}); }} className="input-glass flex-1" placeholder={`Шаг ${i+1}`} />
              {sessionForm.steps.length > 1 && (
                <button onClick={() => setSessionForm({...sessionForm, steps: sessionForm.steps.filter((_, j) => j !== i)})} className="text-destructive p-2"><Trash2 size={14} /></button>
              )}
            </div>
          ))}
          <button onClick={() => setSessionForm({...sessionForm, steps: [...sessionForm.steps, '']})} className="text-[10px] font-bold text-secondary uppercase tracking-wider">+ Ещё шаг</button>
        </div>
        <div className="space-y-2">
          <p className="label-tiny">Ссылки на файлы</p>
          {editingSessionId && (() => {
            const existingSession = sessions.find(s => s.id === editingSessionId);
            const existingFiles = existingSession?.files || [];
            if (existingFiles.length === 0) return null;
            return (
              <div className="space-y-1">
                {existingFiles.map((url: string, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-xl">
                    <span className="text-[10px] text-foreground font-medium truncate">🔗 {url}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          {sessionForm.file_urls.map((url, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Link size={14} className="text-muted-foreground shrink-0" />
              <input value={url} onChange={e => { const urls = [...sessionForm.file_urls]; urls[i] = e.target.value; setSessionForm({...sessionForm, file_urls: urls}); }} className="input-glass flex-1 text-xs" placeholder="https://docs.google.com/..." />
              <button onClick={() => setSessionForm({...sessionForm, file_urls: sessionForm.file_urls.filter((_, j) => j !== i)})} className="text-destructive p-1"><Trash2 size={12} /></button>
            </div>
          ))}
          <button onClick={() => setSessionForm({...sessionForm, file_urls: [...sessionForm.file_urls, '']})} className="text-[10px] font-bold text-secondary uppercase tracking-wider">+ Добавить ссылку</button>
        </div>
        <button onClick={handleSaveSession} className="w-full py-4 btn-dark">{editingSessionId ? 'Сохранить изменения' : 'Сохранить сессию'}</button>
      </ModalOverlay>

      {/* ========== PROTOCOLS ========== */}
      <Section title="Протоколы" icon={Zap} action={<AddButton onClick={openCreateProtocol} label="Добавить" />}>
        {protocols.length === 0 ? (
          <p className="text-xs text-muted-foreground">Протоколов нет</p>
        ) : (
          protocols.map((p) => (
            <div key={p.id} className="glass card-round p-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">{p.title}</p>
                <div className="flex items-center space-x-2">
                  <button onClick={() => openEditProtocol(p)} className="text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteProtocol(p.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{p.description}</p>
              {p.file_url && (
                <p className="text-[10px] text-secondary font-medium">🔗 Ссылка прикреплена</p>
              )}
            </div>
          ))
        )}
      </Section>

      {/* Protocol Form Modal (create + edit) */}
      <ModalOverlay
        isOpen={showProtocolForm}
        onClose={() => { setShowProtocolForm(false); setEditingProtocolId(null); }}
        title={editingProtocolId ? 'Редактировать протокол' : 'Новый протокол'}
      >
        <div className="space-y-1">
          <p className="label-tiny">Название</p>
          <input value={protocolForm.title} onChange={e => setProtocolForm({...protocolForm, title: e.target.value})} className="input-glass" placeholder="Протокол восстановления..." />
        </div>
        <div className="space-y-1">
          <p className="label-tiny">Описание</p>
          <textarea value={protocolForm.description} onChange={e => setProtocolForm({...protocolForm, description: e.target.value})} rows={2} className="input-glass resize-none" placeholder="Краткое описание..." />
        </div>
        <div className="space-y-1">
          <p className="label-tiny">Цвет</p>
          <div className="flex space-x-2">
            {['amber', 'emerald', 'purple', 'rose', 'blue'].map(c => (
              <button key={c} onClick={() => setProtocolForm({...protocolForm, color: c})}
                className={`w-8 h-8 rounded-full transition-all ${protocolForm.color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                style={{ backgroundColor: c === 'amber' ? '#f59e0b' : c === 'emerald' ? '#10b981' : c === 'purple' ? '#8b5cf6' : c === 'rose' ? '#f43f5e' : '#3b82f6' }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="label-tiny">Ссылка на файл</p>
          <div className="flex items-center space-x-2">
            <Link size={14} className="text-muted-foreground shrink-0" />
            <input type="url" value={protocolForm.file_url} onChange={e => setProtocolForm({...protocolForm, file_url: e.target.value})} className="input-glass flex-1 text-xs" placeholder="https://docs.google.com/..." />
          </div>
          {protocolForm.file_url && !isValidUrl(protocolForm.file_url) && (
            <p className="text-[10px] text-destructive">Ссылка должна начинаться с http:// или https://</p>
          )}
        </div>
        <button onClick={handleSaveProtocol} className="w-full py-4 btn-dark">{editingProtocolId ? 'Сохранить изменения' : 'Сохранить протокол'}</button>
      </ModalOverlay>

      {/* ========== ROADMAPS ========== */}
      <Section title="Дорожные карты" icon={Map} action={<AddButton onClick={openCreateRoadmap} label="Добавить" />}>
        {roadmaps.length === 0 ? (
          <p className="text-xs text-muted-foreground">Карт нет</p>
        ) : (
          roadmaps.map((r) => (
            <div key={r.id} className="glass card-round p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">{r.title}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{r.status}</span>
                  <button onClick={() => openEditRoadmapMeta(r)} className="text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteRoadmap(r.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{r.description}</p>

              {/* File link */}
              {r.file_url && (
                <button onClick={() => window.open(r.file_url, '_blank')} className="text-[10px] text-secondary font-medium underline bg-transparent border-none p-0 cursor-pointer">
                  🔗 Открыть файл дорожной карты
                </button>
              )}

              {/* Steps */}
              <div className="space-y-2">
                {r.roadmap_steps?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((s: any) => (
                  <div key={s.id} className="flex items-center space-x-2 group">
                     <button onClick={() => handleUpdateStep(s.id, { done: !s.done })} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${s.done ? 'bg-secondary border-secondary' : 'border-muted-foreground/30'}`}>
                       {s.done && <Check size={12} className="text-secondary-foreground" />}
                    </button>
                    {editingRoadmap === s.id ? (
                      <input
                        autoFocus
                        defaultValue={s.text}
                        onBlur={e => { handleUpdateStep(s.id, { text: e.target.value }); setEditingRoadmap(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') { handleUpdateStep(s.id, { text: (e.target as HTMLInputElement).value }); setEditingRoadmap(null); } }}
                        className="flex-1 text-xs bg-transparent border-b border-secondary/30 focus:outline-none py-1"
                      />
                    ) : (
                      <span onClick={() => setEditingRoadmap(s.id)} className={`flex-1 text-xs cursor-pointer hover:text-secondary transition-colors ${s.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{s.text}</span>
                    )}
                    {s.deadline && <span className="text-[9px] text-muted-foreground">{s.deadline}</span>}
                    <button onClick={() => handleDeleteStep(s.id)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => handleAddStep(r.id)} className="text-[10px] font-bold text-secondary uppercase tracking-wider">+ Добавить шаг</button>
            </div>
          ))
        )}
      </Section>

      {/* Roadmap Form Modal (create + edit) */}
      <ModalOverlay
        isOpen={showRoadmapForm}
        onClose={() => { setShowRoadmapForm(false); setEditingRoadmapId(null); }}
        title={editingRoadmapId ? 'Редактировать карту' : 'Новая дорожная карта'}
      >
        <div className="space-y-1">
          <p className="label-tiny">Название</p>
          <input value={roadmapForm.title} onChange={e => setRoadmapForm({...roadmapForm, title: e.target.value})} className="input-glass" placeholder="Предварительная / Утвержденная / Итоговая" />
        </div>
        <div className="space-y-1">
          <p className="label-tiny">Описание</p>
          <textarea value={roadmapForm.description} onChange={e => setRoadmapForm({...roadmapForm, description: e.target.value})} rows={2} className="input-glass resize-none" />
        </div>
        <div className="space-y-1">
          <p className="label-tiny">Статус</p>
          <select value={roadmapForm.status} onChange={e => setRoadmapForm({...roadmapForm, status: e.target.value})} className="input-glass">
            <option>В работе</option>
            <option>Утверждена</option>
            <option>Завершена</option>
          </select>
        </div>
        <div className="space-y-1">
          <p className="label-tiny">Ссылка на файл</p>
          <div className="flex items-center space-x-2">
            <Link size={14} className="text-muted-foreground shrink-0" />
            <input type="url" value={roadmapForm.file_url} onChange={e => setRoadmapForm({...roadmapForm, file_url: e.target.value})} className="input-glass flex-1 text-xs" placeholder="https://docs.google.com/..." />
          </div>
          {roadmapForm.file_url && !isValidUrl(roadmapForm.file_url) && (
            <p className="text-[10px] text-destructive">Ссылка должна начинаться с http:// или https://</p>
          )}
        </div>
        {!editingRoadmapId && (
          <div className="space-y-2">
            <p className="label-tiny">Шаги</p>
            {roadmapForm.steps.map((step, i) => (
              <div key={i} className="flex space-x-2">
                <input value={step} onChange={e => { const s = [...roadmapForm.steps]; s[i] = e.target.value; setRoadmapForm({...roadmapForm, steps: s}); }} className="input-glass flex-1" placeholder={`Шаг ${i+1}`} />
                {roadmapForm.steps.length > 1 && (
                  <button onClick={() => setRoadmapForm({...roadmapForm, steps: roadmapForm.steps.filter((_, j) => j !== i)})} className="text-destructive p-2"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setRoadmapForm({...roadmapForm, steps: [...roadmapForm.steps, '']})} className="text-[10px] font-bold text-secondary uppercase tracking-wider">+ Ещё шаг</button>
          </div>
        )}
        <button onClick={handleSaveRoadmap} className="w-full py-4 btn-dark">{editingRoadmapId ? 'Сохранить изменения' : 'Создать карту'}</button>
      </ModalOverlay>

      {/* ========== TRACKING QUESTIONS ========== */}
      <Section title="Вопросы трекинга" icon={MessageSquare} action={<AddButton onClick={() => setShowQuestionForm(true)} label="Добавить" />}>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="daily" className="flex-1">Ежедневные</TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1">Еженедельные</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            {dailyQuestions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Вопросов нет</p>
            ) : (
              <div className="space-y-2">
                {dailyQuestions.map(q => (
                  <div key={q.id} className="glass card-round p-3 flex items-center space-x-2 group">
                    <div className="flex-1">
                      {editingQuestionId === q.id ? (
                        <input autoFocus value={editingQuestionText}
                          onChange={e => setEditingQuestionText(e.target.value)}
                          onBlur={() => handleUpdateQuestion(q.id, editingQuestionText)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateQuestion(q.id, editingQuestionText); }}
                          className="w-full text-xs bg-transparent border-b border-secondary/30 focus:outline-none py-1" />
                      ) : (
                        <p className="text-xs text-foreground">{q.question_text}</p>
                      )}
                      <span className="text-[9px] text-muted-foreground uppercase">{q.field_type === 'scale' ? 'шкала 1-10' : 'текст'}</span>
                    </div>
                    <button onClick={() => { setEditingQuestionId(q.id); setEditingQuestionText(q.question_text); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"><Edit2 size={12} /></button>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="weekly">
            {weeklyQuestions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Вопросов нет</p>
            ) : (
              <div className="space-y-2">
                {weeklyQuestions.map(q => (
                  <div key={q.id} className="glass card-round p-3 flex items-center space-x-2 group">
                    <div className="flex-1">
                      {editingQuestionId === q.id ? (
                        <input autoFocus value={editingQuestionText}
                          onChange={e => setEditingQuestionText(e.target.value)}
                          onBlur={() => handleUpdateQuestion(q.id, editingQuestionText)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateQuestion(q.id, editingQuestionText); }}
                          className="w-full text-xs bg-transparent border-b border-secondary/30 focus:outline-none py-1" />
                      ) : (
                        <p className="text-xs text-foreground">{q.question_text}</p>
                      )}
                      <span className="text-[9px] text-muted-foreground uppercase">{q.field_type === 'scale' ? 'шкала 1-10' : 'текст'}</span>
                    </div>
                    <button onClick={() => { setEditingQuestionId(q.id); setEditingQuestionText(q.question_text); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"><Edit2 size={12} /></button>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Section>

      {/* Question Form Modal */}
      <ModalOverlay
        isOpen={showQuestionForm}
        onClose={() => setShowQuestionForm(false)}
        title="Новый вопрос"
      >
        <div className="space-y-1">
          <p className="label-tiny">Тип</p>
          <select value={questionForm.question_type} onChange={e => setQuestionForm({...questionForm, question_type: e.target.value as any})} className="input-glass">
            <option value="daily">Ежедневный</option>
            <option value="weekly">Еженедельный</option>
          </select>
        </div>
        <div className="space-y-1">
          <p className="label-tiny">Текст вопроса</p>
          <input value={questionForm.question_text} onChange={e => setQuestionForm({...questionForm, question_text: e.target.value})} className="input-glass" placeholder="Как вы себя чувствуете?" />
        </div>
        <div className="space-y-1">
          <p className="label-tiny">Тип ответа</p>
          <select value={questionForm.field_type} onChange={e => setQuestionForm({...questionForm, field_type: e.target.value})} className="input-glass">
            <option value="text">Текстовый</option>
            <option value="scale">Шкала 1-10</option>
          </select>
        </div>
        <button onClick={handleSaveQuestion} className="w-full py-4 btn-dark">Добавить вопрос</button>
      </ModalOverlay>

      {/* ========== POINT B QUESTIONS ========== */}
      <Section title="Вопросы «Точка Б»" icon={Rocket} action={<AddButton onClick={() => setShowPointBForm(true)} label="Добавить" />}>
        {pointBQuestions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Вопросов для итогов менторства нет</p>
        ) : (
          <div className="space-y-2">
            {pointBQuestions.map(q => (
              <div key={q.id} className="glass card-round p-3 flex items-center space-x-2 group">
                <div className="flex-1">
                  {editingPBId === q.id ? (
                    <input autoFocus value={editingPBText}
                      onChange={e => setEditingPBText(e.target.value)}
                      onBlur={() => handleUpdatePBQuestion(q.id, editingPBText)}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdatePBQuestion(q.id, editingPBText); }}
                      className="w-full text-xs bg-transparent border-b border-secondary/30 focus:outline-none py-1" />
                  ) : (
                    <p className="text-xs text-foreground">{q.question_text}</p>
                  )}
                </div>
                <button onClick={() => { setEditingPBId(q.id); setEditingPBText(q.question_text); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"><Edit2 size={12} /></button>
                <button onClick={() => handleDeletePBQuestion(q.id)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Point B Question Form Modal */}
      <ModalOverlay
        isOpen={showPointBForm}
        onClose={() => setShowPointBForm(false)}
        title="Новый вопрос «Точка Б»"
      >
        <div className="space-y-1">
          <p className="label-tiny">Текст вопроса</p>
          <input value={pointBFormText} onChange={e => setPointBFormText(e.target.value)} className="input-glass" placeholder="Что удалось достичь?" />
        </div>
        <button onClick={handleSavePointBQuestion} className="w-full py-4 btn-dark">Добавить вопрос</button>
      </ModalOverlay>

      {/* Removed: Volcanoes, Metrics, Diary — private to user */}
    </div>
  );
};

export default AdminClientView;
