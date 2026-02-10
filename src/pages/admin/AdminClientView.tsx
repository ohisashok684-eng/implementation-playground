import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Map, Heart, FileText, Zap, Flag, Plus, Trash2, X, Upload, Check, Edit2, MessageSquare, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const AdminClientView = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roadmapFileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [volcanoes, setVolcanoes] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [trackingQuestions, setTrackingQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [showRoadmapForm, setShowRoadmapForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<string | null>(null);

  // Session form
  const [sessionForm, setSessionForm] = useState({
    session_number: 1, session_date: '', session_time: '', summary: '', steps: ['']
  });

  // Protocol form
  const [protocolForm, setProtocolForm] = useState({
    title: '', description: '', color: 'amber', file: null as File | null
  });

  // Roadmap form
  const [roadmapForm, setRoadmapForm] = useState({
    title: '', description: '', status: 'В работе'
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

  useEffect(() => {
    if (userId) loadClientData(userId);
  }, [userId]);

  const loadClientData = async (uid: string) => {
    const [profileRes, goalsRes, roadmapsRes, sessionsRes, protocolsRes, diaryRes, volcanoesRes, metricsRes, questionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('goals').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('roadmaps').select('*, roadmap_steps(*)').eq('user_id', uid).order('created_at'),
      supabase.from('sessions').select('*').eq('user_id', uid).order('session_number', { ascending: false }),
      supabase.from('protocols').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('diary_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10),
      supabase.from('volcanoes').select('*').eq('user_id', uid),
      supabase.from('progress_metrics').select('*').eq('user_id', uid),
      supabase.from('tracking_questions').select('*').eq('user_id', uid).order('sort_order'),
    ]);

    setProfile(profileRes.data);
    setGoals(goalsRes.data ?? []);
    setRoadmaps(roadmapsRes.data ?? []);
    setSessions(sessionsRes.data ?? []);
    setProtocols(protocolsRes.data ?? []);
    setDiaryEntries(diaryRes.data ?? []);
    setVolcanoes(volcanoesRes.data ?? []);
    setMetrics(metricsRes.data ?? []);
    setTrackingQuestions(questionsRes.data ?? []);
    setLoading(false);

    // Pre-fill session number
    const maxNum = (sessionsRes.data ?? []).reduce((max: number, s: any) => Math.max(max, s.session_number), 0);
    setSessionForm(prev => ({ ...prev, session_number: maxNum + 1 }));
  };

  // === SESSIONS ===
  const handleSaveSession = async () => {
    if (!userId) return;
    const { error } = await supabase.from('sessions').insert({
      user_id: userId,
      session_number: sessionForm.session_number,
      session_date: sessionForm.session_date,
      session_time: sessionForm.session_time,
      summary: sessionForm.summary,
      steps: sessionForm.steps.filter(s => s.trim()),
    });
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Сессия добавлена' });
      setShowSessionForm(false);
      loadClientData(userId);
    }
  };

  // === PROTOCOLS ===
  const handleSaveProtocol = async () => {
    if (!userId) return;
    let fileUrl: string | null = null;

    if (protocolForm.file) {
      const ext = protocolForm.file.name.split('.').pop();
      const path = `${userId}/protocols/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('mentoring-files').upload(path, protocolForm.file);
      if (upErr) {
        toast({ title: 'Ошибка загрузки файла', description: upErr.message, variant: 'destructive' });
        return;
      }
      const { data: urlData } = supabase.storage.from('mentoring-files').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('protocols').insert({
      user_id: userId,
      title: protocolForm.title,
      description: protocolForm.description,
      color: protocolForm.color,
      file_name: protocolForm.file?.name || '',
      file_url: fileUrl,
    });
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Протокол добавлен' });
      setShowProtocolForm(false);
      setProtocolForm({ title: '', description: '', color: 'amber', file: null });
      loadClientData(userId);
    }
  };

  // === ROADMAPS ===
  const handleSaveRoadmap = async () => {
    if (!userId) return;
    const { error } = await supabase.from('roadmaps').insert({
      user_id: userId,
      title: roadmapForm.title,
      description: roadmapForm.description,
      status: roadmapForm.status,
    });
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Дорожная карта создана' });
      setShowRoadmapForm(false);
      setRoadmapForm({ title: '', description: '', status: 'В работе' });
      loadClientData(userId!);
    }
  };

  const handleAddStep = async (roadmapId: string) => {
    const maxOrder = roadmaps.find(r => r.id === roadmapId)?.roadmap_steps?.length || 0;
    const { error } = await supabase.from('roadmap_steps').insert({
      roadmap_id: roadmapId,
      text: 'Новый шаг',
      sort_order: maxOrder,
    });
    if (!error) loadClientData(userId!);
  };

  const handleUpdateStep = async (stepId: string, updates: any) => {
    await supabase.from('roadmap_steps').update(updates).eq('id', stepId);
    loadClientData(userId!);
  };

  const handleDeleteStep = async (stepId: string) => {
    await supabase.from('roadmap_steps').delete().eq('id', stepId);
    loadClientData(userId!);
  };

  const handleUploadRoadmapFile = async (roadmapId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/roadmaps/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('mentoring-files').upload(path, file);
    if (upErr) {
      toast({ title: 'Ошибка загрузки', description: upErr.message, variant: 'destructive' });
      return;
    }
    const { data: urlData } = supabase.storage.from('mentoring-files').getPublicUrl(path);
    await supabase.from('roadmaps').update({ file_url: urlData.publicUrl } as any).eq('id', roadmapId);
    toast({ title: 'Файл загружен' });
    loadClientData(userId!);
  };

  // === TRACKING QUESTIONS ===
  const handleSaveQuestion = async () => {
    if (!userId) return;
    const maxOrder = trackingQuestions.filter(q => q.question_type === questionForm.question_type).length;
    const { error } = await supabase.from('tracking_questions').insert({
      user_id: userId,
      question_type: questionForm.question_type,
      question_text: questionForm.question_text,
      field_type: questionForm.field_type,
      sort_order: maxOrder,
    } as any);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Вопрос добавлен' });
      setShowQuestionForm(false);
      setQuestionForm({ question_type: 'daily', question_text: '', field_type: 'text' });
      loadClientData(userId);
    }
  };

  const handleUpdateQuestion = async (id: string, text: string) => {
    await supabase.from('tracking_questions').update({ question_text: text } as any).eq('id', id);
    setEditingQuestionId(null);
    loadClientData(userId!);
  };

  const handleDeleteQuestion = async (id: string) => {
    await supabase.from('tracking_questions').delete().eq('id', id);
    loadClientData(userId!);
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
    <button onClick={onClick} className="flex items-center space-x-1 text-[10px] font-bold text-primary uppercase tracking-wider hover:text-primary/80 transition-colors">
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

      {/* ========== SESSIONS ========== */}
      <Section title="Сессии" icon={FileText} action={<AddButton onClick={() => setShowSessionForm(true)} label="Добавить" />}>
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Сессий нет</p>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="glass card-round p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Сессия {s.session_number}</p>
                <span className="text-[10px] text-muted-foreground">{s.session_date} · {s.session_time}</span>
              </div>
              <p className="text-xs text-foreground">{s.summary}</p>
              {s.steps?.length > 0 && (
                <div className="space-y-1 pt-1">
                  {s.steps.map((step: string, i: number) => (
                    <p key={i} className="text-[10px] text-muted-foreground">• {step}</p>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </Section>

      {/* Session Form Modal */}
      {showSessionForm && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in">
          <div className="glass-strong card-round-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">Новая сессия</h3>
              <button onClick={() => setShowSessionForm(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={20} /></button>
            </div>
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
              <button onClick={() => setSessionForm({...sessionForm, steps: [...sessionForm.steps, '']})} className="text-[10px] font-bold text-primary uppercase tracking-wider">+ Ещё шаг</button>
            </div>
            <button onClick={handleSaveSession} className="w-full py-4 btn-dark">Сохранить сессию</button>
          </div>
        </div>
      )}

      {/* ========== PROTOCOLS ========== */}
      <Section title="Протоколы" icon={Zap} action={<AddButton onClick={() => setShowProtocolForm(true)} label="Добавить" />}>
        {protocols.length === 0 ? (
          <p className="text-xs text-muted-foreground">Протоколов нет</p>
        ) : (
          protocols.map((p) => (
            <div key={p.id} className="glass card-round p-4 space-y-1">
              <p className="text-sm font-bold text-foreground">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.description}</p>
              {p.file_name && (
                <p className="text-[10px] text-primary font-medium">📎 {p.file_name}</p>
              )}
            </div>
          ))
        )}
      </Section>

      {/* Protocol Form Modal */}
      {showProtocolForm && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in">
          <div className="glass-strong card-round-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">Новый протокол</h3>
              <button onClick={() => setShowProtocolForm(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={20} /></button>
            </div>
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
              <p className="label-tiny">Файл</p>
              <input type="file" ref={fileInputRef} onChange={e => setProtocolForm({...protocolForm, file: e.target.files?.[0] || null})} className="text-xs" />
              {protocolForm.file && <p className="text-[10px] text-primary font-medium">📎 {protocolForm.file.name}</p>}
            </div>
            <button onClick={handleSaveProtocol} className="w-full py-4 btn-dark">Сохранить протокол</button>
          </div>
        </div>
      )}

      {/* ========== ROADMAPS ========== */}
      <Section title="Дорожные карты" icon={Map} action={<AddButton onClick={() => setShowRoadmapForm(true)} label="Добавить" />}>
        {roadmaps.length === 0 ? (
          <p className="text-xs text-muted-foreground">Карт нет</p>
        ) : (
          roadmaps.map((r) => (
            <div key={r.id} className="glass card-round p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">{r.title}</p>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{r.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{r.description}</p>

              {/* File upload */}
              <div className="flex items-center space-x-2">
                {r.file_url ? (
                  <a href={r.file_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary font-medium underline">📎 Файл дорожной карты</a>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Файл не загружен</span>
                )}
                <label className="cursor-pointer text-[10px] font-bold text-primary uppercase tracking-wider hover:text-primary/80">
                  <Upload size={12} className="inline mr-1" />Загрузить
                  <input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUploadRoadmapFile(r.id, e.target.files[0]); }} />
                </label>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {r.roadmap_steps?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((s: any) => (
                  <div key={s.id} className="flex items-center space-x-2 group">
                    <button onClick={() => handleUpdateStep(s.id, { done: !s.done })} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${s.done ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                      {s.done && <Check size={12} className="text-primary-foreground" />}
                    </button>
                    {editingRoadmap === s.id ? (
                      <input
                        autoFocus
                        defaultValue={s.text}
                        onBlur={e => { handleUpdateStep(s.id, { text: e.target.value }); setEditingRoadmap(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') { handleUpdateStep(s.id, { text: (e.target as HTMLInputElement).value }); setEditingRoadmap(null); } }}
                        className="flex-1 text-xs bg-transparent border-b border-primary/30 focus:outline-none py-1"
                      />
                    ) : (
                      <span onClick={() => setEditingRoadmap(s.id)} className={`flex-1 text-xs cursor-pointer hover:text-primary transition-colors ${s.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{s.text}</span>
                    )}
                    {s.deadline && <span className="text-[9px] text-muted-foreground">{s.deadline}</span>}
                    <button onClick={() => handleDeleteStep(s.id)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <button onClick={() => handleAddStep(r.id)} className="text-[10px] font-bold text-primary uppercase tracking-wider">+ Добавить шаг</button>
            </div>
          ))
        )}
      </Section>

      {/* Roadmap Form Modal */}
      {showRoadmapForm && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in">
          <div className="glass-strong card-round-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">Новая дорожная карта</h3>
              <button onClick={() => setShowRoadmapForm(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={20} /></button>
            </div>
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
            <button onClick={handleSaveRoadmap} className="w-full py-4 btn-dark">Создать карту</button>
          </div>
        </div>
      )}

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
                          className="w-full text-xs bg-transparent border-b border-primary/30 focus:outline-none py-1" />
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
                          className="w-full text-xs bg-transparent border-b border-primary/30 focus:outline-none py-1" />
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
      {showQuestionForm && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in">
          <div className="glass-strong card-round-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">Новый вопрос</h3>
              <button onClick={() => setShowQuestionForm(false)} className="text-muted-foreground hover:text-foreground p-1"><X size={20} /></button>
            </div>
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
          </div>
        </div>
      )}

      {/* ========== READ-ONLY SECTIONS ========== */}

      {/* Goals */}
      <Section title="Цели" icon={Target}>
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

      {/* Volcanoes */}
      <Section title="Аудит вулканов" icon={Flag}>
        {volcanoes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Аудит не заполнен</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {volcanoes.map((v) => (
              <div key={v.id} className="glass card-round p-3">
                <p className="text-xs font-bold text-foreground">{v.name}</p>
                <p className="text-lg font-black text-foreground">{v.value}<span className="text-[10px] text-muted-foreground">/10</span></p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Metrics */}
      <Section title="Метрики состояния" icon={Heart}>
        {metrics.length === 0 ? (
          <p className="text-xs text-muted-foreground">Метрик нет</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((m) => (
              <div key={m.id} className="glass card-round p-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{m.label}</p>
                <p className="text-lg font-black text-foreground">{m.current_value}</p>
                <p className="text-[10px] text-muted-foreground">было: {m.previous_value}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Diary */}
      <Section title="Дневник" icon={Zap}>
        {diaryEntries.length === 0 ? (
          <p className="text-xs text-muted-foreground">Записей нет</p>
        ) : (
          diaryEntries.map((d) => (
            <div key={d.id} className="glass card-round p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-secondary uppercase">{d.entry_type === 'daily' ? 'День' : 'Неделя'}</span>
                <span className="text-[10px] text-muted-foreground">{d.entry_date}</span>
              </div>
              {d.text && <p className="text-xs text-foreground">{d.text}</p>}
              {d.achievements && <p className="text-xs text-foreground">{d.achievements}</p>}
            </div>
          ))
        )}
      </Section>
    </div>
  );
};

export default AdminClientView;
