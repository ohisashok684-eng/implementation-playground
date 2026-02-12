import { useState, useEffect } from 'react';
import { User, Plus, Trash2, X, Flag, Rocket, Check, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import BottomNav from '@/components/BottomNav';
import NotificationToast from '@/components/NotificationToast';
import ModalOverlay from '@/components/ModalOverlay';
import VolcanoIcon from '@/components/VolcanoIcon';
import DashboardTab from '@/tabs/DashboardTab';
import TrackingTab from '@/tabs/TrackingTab';
import RoadmapsTab from '@/tabs/RoadmapsTab';
import ProtocolsTab from '@/tabs/ProtocolsTab';
import {
  initialGoals,
  initialProtocols,
  initialSessions,
  initialDiaryEntries,
  initialVolcanoes,
  initialProgressMetrics,
  initialRoadmaps,
  initialRouteInfo,
} from '@/data/initialData';
import { supabase } from '@/integrations/supabase/client';
import type { TabId, Goal, DiaryEntry } from '@/types/mentoring';

const Index = () => {
  const { signOut, profileName, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data states
  const [goals, setGoals] = useState(initialGoals);
  const [protocols, setProtocols] = useState(initialProtocols);
  const [sessions, setSessions] = useState(initialSessions);
  const [diaryEntries, setDiaryEntries] = useState(initialDiaryEntries);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [volcanoes, setVolcanoes] = useState(initialVolcanoes);
  const [progressMetrics, setProgressMetrics] = useState(initialProgressMetrics);
  const [roadmaps, setRoadmaps] = useState(initialRoadmaps);
  const [routeInfo, setRouteInfo] = useState(initialRouteInfo);

  // Point B dynamic state
  const [pointBQuestions, setPointBQuestions] = useState<any[]>([]);
  const [pointBAnswers, setPointBAnswers] = useState<Record<string, string>>({});
  const [savedStatusB, setSavedStatusB] = useState<string | null>(null);

  // Volcano saved status
  const [savedStatus, setSavedStatus] = useState<number | null>(null);

  // Modal states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | number | null>(null);
  const [tempGoal, setTempGoal] = useState<Goal>({ id: 0, title: '', amount: '', hasAmount: false, progress: 0 });

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [tempRoute, setTempRoute] = useState(routeInfo);
  const [newResource, setNewResource] = useState('');

  const [editingMetric, setEditingMetric] = useState<string | null>(null);

  const [isPointAModalOpen, setIsPointAModalOpen] = useState(false);
  const [isPointBModalOpen, setIsPointBModalOpen] = useState(false);

  // Load all data from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [goalsRes, sessionsRes, protocolsRes, roadmapsRes, volcanoesRes, metricsRes, routeRes, diaryRes, questionsRes, answersRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('sessions').select('*').eq('user_id', user.id).order('session_number'),
        supabase.from('protocols').select('*').eq('user_id', user.id),
        supabase.from('roadmaps').select('*, roadmap_steps(*)').eq('user_id', user.id),
        supabase.from('volcanoes').select('*').eq('user_id', user.id),
        supabase.from('progress_metrics').select('*').eq('user_id', user.id),
        supabase.from('route_info').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('diary_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('point_b_questions').select('*').eq('user_id', user.id).order('sort_order'),
        supabase.from('point_b_answers').select('*').eq('user_id', user.id),
      ]);

      // Goals
      if (goalsRes.data && goalsRes.data.length > 0) {
        setGoals(goalsRes.data.map((g: any) => ({
          id: g.id,
          title: g.title,
          amount: g.amount || '',
          hasAmount: g.has_amount,
          progress: g.progress,
        })));
      }

      // Sessions
      if (sessionsRes.data && sessionsRes.data.length > 0) {
        setSessions(sessionsRes.data.map((s: any) => ({
          number: s.session_number,
          date: s.session_date,
          time: s.session_time,
          summary: s.summary,
          steps: s.steps || [],
          gradient: s.gradient,
          files: s.files || [],
        })));
      }

      // Protocols
      if (protocolsRes.data && protocolsRes.data.length > 0) {
        setProtocols(protocolsRes.data.map((p: any) => ({
          id: p.id,
          title: p.title,
          desc: p.description,
          icon: p.icon,
          color: p.color,
          fileName: p.file_name,
          fileUrl: p.file_url || undefined,
        })));
      }

      // Roadmaps
      if (roadmapsRes.data && roadmapsRes.data.length > 0) {
        setRoadmaps(roadmapsRes.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          description: r.description,
          fileUrl: r.file_url || undefined,
          steps: (r.roadmap_steps || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((st: any) => ({
              text: st.text,
              done: st.done,
              deadline: st.deadline || '',
            })),
        })));
      }

      // Volcanoes
      if (volcanoesRes.data && volcanoesRes.data.length > 0) {
        setVolcanoes(volcanoesRes.data.map((v: any) => ({
          name: v.name,
          value: v.value,
          comment: v.comment,
        })));
      }

      // Metrics
      if (metricsRes.data && metricsRes.data.length > 0) {
        const mapped: Record<string, any> = {};
        metricsRes.data.forEach((m: any) => {
          mapped[m.metric_key] = {
            label: m.label,
            current: m.current_value,
            previous: m.previous_value,
          };
        });
        setProgressMetrics(prev => ({ ...prev, ...mapped }));
      }

      // Route info
      if (routeRes.data) {
        setRouteInfo({
          sessionsTotal: routeRes.data.sessions_total,
          sessionsDone: routeRes.data.sessions_done,
          timeWeeks: routeRes.data.time_weeks,
          resources: routeRes.data.resources || [],
        });
      }

      // Diary
      if (diaryRes.data && diaryRes.data.length > 0) {
        setDiaryEntries(diaryRes.data.map((d: any) => ({
          id: d.id,
          type: d.entry_type as 'daily' | 'weekly',
          date: d.entry_date,
          energy: d.energy ?? undefined,
          text: d.text ?? undefined,
          intent: d.intent ?? undefined,
          achievements: d.achievements ?? undefined,
          lessons: d.lessons ?? undefined,
          nextStep: d.next_step ?? undefined,
        })));
      }

      // Point B
      setPointBQuestions(questionsRes.data ?? []);
      const answerMap: Record<string, string> = {};
      (answersRes.data ?? []).forEach((a: any) => { answerMap[a.question_id] = a.answer_text; });
      setPointBAnswers(answerMap);

      setDataLoaded(true);
    };
    load();
  }, [user]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Goal handlers
  const openAddGoal = () => {
    setEditingGoalId(null);
    setTempGoal({ id: 0, title: '', amount: '', hasAmount: false, progress: 0 });
    setIsGoalModalOpen(true);
  };

  const openEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setTempGoal({ ...goal });
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    if (editingGoalId) {
      setGoals(goals.map((g) => (g.id === editingGoalId ? { ...tempGoal } : g)));
      await supabase.from('goals').update({
        title: tempGoal.title,
        amount: tempGoal.amount,
        has_amount: tempGoal.hasAmount,
        progress: tempGoal.progress,
      }).eq('id', String(editingGoalId));
    } else {
      const { data } = await supabase.from('goals').insert({
        user_id: user.id,
        title: tempGoal.title,
        amount: tempGoal.amount,
        has_amount: tempGoal.hasAmount,
        progress: tempGoal.progress,
      }).select().single();
      if (data) {
        setGoals([...goals, { ...tempGoal, id: data.id }]);
      }
    }
    setIsGoalModalOpen(false);
  };

  const deleteGoal = async (id: string | number) => {
    setGoals(goals.filter((g) => g.id !== id));
    await supabase.from('goals').delete().eq('id', String(id));
    setIsGoalModalOpen(false);
  };

  // Route handlers
  const openRouteModal = () => {
    setTempRoute({ ...routeInfo });
    setIsRouteModalOpen(true);
  };

  const saveRoute = async () => {
    if (!user) return;
    setRouteInfo({ ...tempRoute });
    await supabase.from('route_info').upsert({
      user_id: user.id,
      sessions_total: tempRoute.sessionsTotal,
      sessions_done: tempRoute.sessionsDone,
      time_weeks: tempRoute.timeWeeks,
      resources: tempRoute.resources,
    } as any, { onConflict: 'user_id' });
    setIsRouteModalOpen(false);
  };

  const addResource = () => {
    if (newResource.trim()) {
      setTempRoute((prev) => ({ ...prev, resources: [...prev.resources, newResource.trim()] }));
      setNewResource('');
    }
  };

  const removeResource = (index: number) => {
    setTempRoute((prev) => ({ ...prev, resources: prev.resources.filter((_, i) => i !== index) }));
  };

  // Metric handler
  const updateMetricValue = async (val: number) => {
    if (!editingMetric || !user) return;
    const metric = progressMetrics[editingMetric];
    const prevValue = metric.current;
    const metricKey = editingMetric;
    setProgressMetrics((prev) => ({
      ...prev,
      [metricKey]: { ...prev[metricKey], previous: prevValue, current: val },
    }));
    setEditingMetric(null);
    await supabase.from('progress_metrics').upsert({
      user_id: user.id,
      metric_key: metricKey,
      label: metric.label,
      current_value: val,
      previous_value: prevValue,
    } as any, { onConflict: 'user_id,metric_key' });
  };

  // Volcano handlers
  const updateVolcanoValue = (index: number, newValue: number) => {
    const updated = [...volcanoes];
    updated[index].value = newValue;
    setVolcanoes(updated);
  };

  const updateVolcanoComment = (index: number, comment: string) => {
    const updated = [...volcanoes];
    updated[index].comment = comment;
    setVolcanoes(updated);
  };

  const fixVolcanoComment = async (index: number) => {
    if (!user) return;
    const v = volcanoes[index];
    await supabase.from('volcanoes').upsert({
      user_id: user.id,
      name: v.name,
      value: v.value,
      comment: v.comment,
    } as any, { onConflict: 'user_id,name' });
    setSavedStatus(index);
    setTimeout(() => setSavedStatus(null), 1500);
  };

  // Point B handlers
  const fixResultB = async (questionId: string) => {
    if (!user) return;
    const text = pointBAnswers[questionId] || '';
    await supabase.from('point_b_answers').upsert({
      user_id: user.id,
      question_id: questionId,
      answer_text: text,
    } as any, { onConflict: 'user_id,question_id' });
    setSavedStatusB(questionId);
    setTimeout(() => setSavedStatusB(null), 1500);
  };

  // Diary handlers
  const handleSaveDaily = async (form: { energy: number; text: string; intent: string }) => {
    if (!user) return;
    const dateStr = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    const { data } = await supabase.from('diary_entries').insert({
      user_id: user.id,
      entry_type: 'daily',
      entry_date: dateStr,
      energy: form.energy,
      text: form.text,
      intent: form.intent,
    }).select().single();
    const newEntry: DiaryEntry = {
      id: data?.id || Date.now(),
      type: 'daily',
      date: dateStr,
      ...form,
    };
    setDiaryEntries([newEntry, ...diaryEntries]);
  };

  const handleSaveWeekly = async (form: { achievements: string; lessons: string; nextStep: string }) => {
    if (!user) return;
    const dateStr = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    const { data } = await supabase.from('diary_entries').insert({
      user_id: user.id,
      entry_type: 'weekly',
      entry_date: dateStr,
      achievements: form.achievements,
      lessons: form.lessons,
      next_step: form.nextStep,
    }).select().single();
    const newEntry: DiaryEntry = {
      id: data?.id || Date.now(),
      type: 'weekly',
      date: dateStr,
      ...form,
    };
    setDiaryEntries([newEntry, ...diaryEntries]);
  };

  const formatAmount = (val: string) => {
    if (!val) return '0';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationToast notification={notification} />

      {/* Header */}
      <header className="sticky top-0 z-40 px-5 pt-6 pb-3 bg-background/80 backdrop-blur-xl">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Приветствуем</p>
            <h1 className="text-xl font-black text-foreground">{profileName || 'Пользователь'}</h1>
          </div>
          <button
            onClick={signOut}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors"
            title="Выйти"
          >
            <LogOut size={18} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-5 pb-32 max-w-md mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardTab
            routeInfo={routeInfo}
            goals={goals}
            sessions={sessions}
            progressMetrics={progressMetrics}
            onEditRoute={openRouteModal}
            onEditGoal={openEditGoal}
            onAddGoal={openAddGoal}
            onEditMetric={setEditingMetric}
            onOpenPointA={() => setIsPointAModalOpen(true)}
            onOpenPointB={() => setIsPointBModalOpen(true)}
          />
        )}
        {activeTab === 'roadmaps' && (
          <RoadmapsTab roadmaps={roadmaps} onUpdateRoadmaps={setRoadmaps} />
        )}
        {activeTab === 'tracking' && (
          <TrackingTab
            userId={user?.id || ''}
            diaryEntries={diaryEntries}
            onSaveDaily={handleSaveDaily}
            onSaveWeekly={handleSaveWeekly}
          />
        )}
        {activeTab === 'protocols' && (
          <ProtocolsTab
            protocols={protocols}
            onUpdateProtocols={setProtocols}
            onNotify={setNotification}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Goal Modal */}
      <ModalOverlay isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Правка цели">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="label-tiny">Название</p>
            <input
              type="text"
              value={tempGoal.title}
              onChange={(e) => setTempGoal({ ...tempGoal, title: e.target.value })}
              className="input-glass"
              placeholder="например: запуск сообщества"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="label-tiny">Финансовая цель</p>
            <button
              onClick={() => setTempGoal({ ...tempGoal, hasAmount: !tempGoal.hasAmount })}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                tempGoal.hasAmount ? 'bg-purple-500' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                  tempGoal.hasAmount ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          {tempGoal.hasAmount && (
            <div className="space-y-2">
              <p className="label-tiny">Сумма (₽)</p>
              <input
                type="text"
                value={formatAmount(tempGoal.amount)}
                onChange={(e) => setTempGoal({ ...tempGoal, amount: e.target.value.replace(/\s/g, '') })}
                className="input-glass font-bold"
              />
            </div>
          )}
          <div className="space-y-2">
            <p className="label-tiny">Прогресс (%)</p>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min={0}
                max={100}
                value={tempGoal.progress}
                onChange={(e) => setTempGoal({ ...tempGoal, progress: parseInt(e.target.value) })}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-sm font-bold text-foreground w-12 text-right">{tempGoal.progress}%</span>
            </div>
          </div>
          <button onClick={handleSaveGoal} className="w-full py-5 btn-dark">
            Сохранить
          </button>
          {editingGoalId && (
            <button
              onClick={() => deleteGoal(editingGoalId)}
              className="w-full text-center text-[10px] text-rose-400 font-bold uppercase tracking-widest py-2 hover:text-rose-600 transition-colors"
            >
              Удалить цель
            </button>
          )}
        </div>
      </ModalOverlay>

      {/* Route Modal */}
      <ModalOverlay isOpen={isRouteModalOpen} onClose={() => setIsRouteModalOpen(false)} title="Мой маршрут">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="label-tiny">Сессии</p>
              <input
                type="number"
                value={tempRoute.sessionsTotal}
                onChange={(e) => setTempRoute({ ...tempRoute, sessionsTotal: parseInt(e.target.value) || 0 })}
                className="input-glass font-bold"
              />
            </div>
            <div className="space-y-2">
              <p className="label-tiny">Недель</p>
              <input
                type="number"
                value={tempRoute.timeWeeks}
                onChange={(e) => setTempRoute({ ...tempRoute, timeWeeks: parseInt(e.target.value) || 0 })}
                className="input-glass font-bold"
              />
            </div>
          </div>
          <div className="space-y-3">
            <p className="label-tiny">Ресурсы</p>
            {tempRoute.resources.map((res, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <span className="text-xs font-medium text-foreground">{res}</span>
                <button onClick={() => removeResource(i)} className="text-slate-300 hover:text-rose-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newResource}
                onChange={(e) => setNewResource(e.target.value)}
                placeholder="новый ресурс..."
                className="flex-1 p-3 bg-white border border-slate-100 rounded-2xl text-xs focus:outline-none focus:border-purple-200"
                onKeyDown={(e) => e.key === 'Enter' && addResource()}
              />
              <button onClick={addResource} className="p-3 bg-[#D9FF5F] text-slate-900 rounded-2xl active:scale-90 transition-transform">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <button onClick={saveRoute} className="w-full py-5 btn-dark">
            Сохранить изменения
          </button>
        </div>
      </ModalOverlay>

      {/* Metric Picker */}
      {editingMetric && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-end justify-center p-4 animate-in">
          <div className="glass-strong card-round-lg w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-black text-foreground text-center">Выберите значение от 1 до 10</h3>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => updateMetricValue(num)}
                  className={`h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all active:scale-90 min-w-0 ${
                    editingMetric && progressMetrics[editingMetric]?.current === num
                      ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/30'
                      : 'bg-muted hover:bg-primary hover:text-primary-foreground'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEditingMetric(null)}
              className="w-full py-4 text-xs font-bold uppercase text-slate-400 hover:text-slate-600 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Point A Modal - Аудит 7 вулканов */}
      {isPointAModalOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in">
          <div className="glass-strong card-round-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Flag size={20} className="text-amber-500" />
                <h2 className="text-xl font-black text-foreground">Аудит 7 вулканов</h2>
              </div>
              <button onClick={() => setIsPointAModalOpen(false)} className="text-slate-300 hover:text-slate-600 p-2">
                <X size={24} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              Оцени свою удовлетворенность сферами жизни от 1 до 10
            </p>

            <div className="space-y-4">
              {volcanoes.map((v, i) => (
                <div key={i} className="p-4 card-round bg-white/50 border border-white/40 space-y-3">
                  <div className="flex items-center space-x-3">
                    <VolcanoIcon value={v.value} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{i + 1}. {v.name}</p>
                    </div>
                    <span className="text-lg font-black text-foreground">{v.value}</span>
                  </div>

                  {/* Buttons 1-10 */}
                  <div className="grid grid-cols-10 gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => updateVolcanoValue(i, num)}
                        className={`h-8 rounded-lg text-[10px] font-bold transition-all ${
                          v.value === num
                            ? 'bg-amber-500 text-white scale-110 shadow-md z-10'
                            : 'text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  {/* Comment field when value < 8 */}
                  {v.value < 8 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Что мне нужно добавить, чтобы было 10?
                      </p>
                      <div className="relative">
                        <textarea
                          value={v.comment}
                          onChange={(e) => updateVolcanoComment(i, e.target.value)}
                          placeholder="напишите конкретные шаги..."
                          rows={3}
                          className="w-full p-4 pr-12 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-purple-200 resize-none font-medium text-slate-700 leading-relaxed"
                        />
                        <button
                          onClick={() => fixVolcanoComment(i)}
                          className={`absolute top-3 right-3 p-2 rounded-xl shadow-sm transition-all active:scale-90 ${
                            savedStatus === i
                              ? 'bg-[#D9FF5F] text-[#8EAC24] scale-105'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          <Check size={14} className={savedStatus === i ? 'animate-in' : ''} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsPointAModalOpen(false)}
              className="w-full py-5 btn-dark"
            >
              Завершить аудит
            </button>
          </div>
        </div>
      )}

      {/* Point B Modal - Итоги менторства */}
      {isPointBModalOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in">
          <div className="glass-strong card-round-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Rocket size={20} className="text-secondary" />
                <h2 className="text-xl font-black text-foreground">Итоги менторства</h2>
              </div>
              <button onClick={() => setIsPointBModalOpen(false)} className="text-muted-foreground hover:text-foreground p-2">
                <X size={24} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              Заполняется на итоговой сессии. Анализ достижений и пройденного пути
            </p>

            {pointBQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Вопросы для итогов менторства пока не добавлены</p>
            ) : (
              <div className="space-y-5">
                {pointBQuestions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <p className="label-tiny">{q.question_text}</p>
                    <div className="relative">
                      <textarea
                        value={pointBAnswers[q.id] || ''}
                        onChange={(e) => setPointBAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        rows={4}
                        className="input-glass pr-12 resize-none leading-relaxed"
                      />
                      <button
                        onClick={() => fixResultB(q.id)}
                        className={`absolute top-3 right-3 p-2 rounded-xl shadow-sm transition-all active:scale-90 ${
                          savedStatusB === q.id
                            ? 'bg-primary text-primary-foreground scale-105'
                            : 'bg-foreground text-background hover:bg-foreground/80'
                        }`}
                      >
                        <Check size={14} className={savedStatusB === q.id ? 'animate-in' : ''} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
