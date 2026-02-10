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
  initialPointB,
} from '@/data/initialData';
import type { TabId, Goal, DiaryEntry } from '@/types/mentoring';

const Index = () => {
  const { signOut, profileName } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data states
  const [goals, setGoals] = useState(initialGoals);
  const [protocols, setProtocols] = useState(initialProtocols);
  const [sessions] = useState(initialSessions);
  const [diaryEntries, setDiaryEntries] = useState(initialDiaryEntries);
  const [volcanoes, setVolcanoes] = useState(initialVolcanoes);
  const [progressMetrics, setProgressMetrics] = useState(initialProgressMetrics);
  const [roadmaps, setRoadmaps] = useState(initialRoadmaps);
  const [routeInfo, setRouteInfo] = useState(initialRouteInfo);

  // Point B editable state
  const [resultsB, setResultsB] = useState(initialPointB);
  const [savedStatusB, setSavedStatusB] = useState<string | null>(null);

  // Volcano saved status
  const [savedStatus, setSavedStatus] = useState<number | null>(null);

  // Modal states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [tempGoal, setTempGoal] = useState<Goal>({ id: 0, title: '', amount: '', hasAmount: false, progress: 0 });

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [tempRoute, setTempRoute] = useState(routeInfo);
  const [newResource, setNewResource] = useState('');

  const [editingMetric, setEditingMetric] = useState<string | null>(null);

  const [isPointAModalOpen, setIsPointAModalOpen] = useState(false);
  const [isPointBModalOpen, setIsPointBModalOpen] = useState(false);

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

  const handleSaveGoal = () => {
    if (editingGoalId) {
      setGoals(goals.map((g) => (g.id === editingGoalId ? { ...tempGoal } : g)));
    } else {
      setGoals([...goals, { ...tempGoal, id: Date.now() }]);
    }
    setIsGoalModalOpen(false);
  };

  const deleteGoal = (id: number) => {
    setGoals(goals.filter((g) => g.id !== id));
    setIsGoalModalOpen(false);
  };

  // Route handlers
  const openRouteModal = () => {
    setTempRoute({ ...routeInfo });
    setIsRouteModalOpen(true);
  };

  const saveRoute = () => {
    setRouteInfo({ ...tempRoute });
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
  const updateMetricValue = (val: number) => {
    if (!editingMetric) return;
    const prevValue = progressMetrics[editingMetric].current;
    setProgressMetrics((prev) => ({
      ...prev,
      [editingMetric]: { ...prev[editingMetric], previous: prevValue, current: val },
    }));
    setEditingMetric(null);
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

  const fixVolcanoComment = (index: number) => {
    setSavedStatus(index);
    setTimeout(() => setSavedStatus(null), 1500);
  };

  // Point B handlers
  const fixResultB = (field: string) => {
    setSavedStatusB(field);
    setTimeout(() => setSavedStatusB(null), 1500);
  };

  // Diary handlers
  const handleSaveDaily = (form: { energy: number; text: string; intent: string }) => {
    const newEntry: DiaryEntry = {
      id: Date.now(),
      type: 'daily',
      date: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
      ...form,
    };
    setDiaryEntries([newEntry, ...diaryEntries]);
  };

  const handleSaveWeekly = (form: { achievements: string; lessons: string; nextStep: string }) => {
    const newEntry: DiaryEntry = {
      id: Date.now(),
      type: 'weekly',
      date: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
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
                  className="h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all bg-muted hover:bg-primary hover:text-primary-foreground active:scale-90"
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
                  <div className="flex justify-between space-x-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => updateVolcanoValue(i, num)}
                        className={`flex-1 min-w-[28px] h-8 rounded-lg text-[10px] font-bold transition-all ${
                          v.value === num
                            ? 'bg-amber-500 text-white scale-110 shadow-md'
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
                <Rocket size={20} className="text-purple-600" />
                <h2 className="text-xl font-black text-foreground">Итоги менторства</h2>
              </div>
              <button onClick={() => setIsPointBModalOpen(false)} className="text-slate-300 hover:text-slate-600 p-2">
                <X size={24} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              Заполняется на итоговой сессии. Анализ достижений и пройденного пути
            </p>

            <div className="space-y-5">
              {/* Achieved */}
              <div className="space-y-2">
                <p className="label-tiny">Что удалось достичь?</p>
                <div className="relative">
                  <textarea
                    value={resultsB.achieved}
                    onChange={(e) => setResultsB({ ...resultsB, achieved: e.target.value })}
                    rows={4}
                    className="w-full p-4 pr-12 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-purple-200 resize-none font-medium text-slate-700 leading-relaxed shadow-sm transition-all"
                  />
                  <button
                    onClick={() => fixResultB('achieved')}
                    className={`absolute top-3 right-3 p-2 rounded-xl shadow-sm transition-all active:scale-90 ${
                      savedStatusB === 'achieved'
                        ? 'bg-[#D9FF5F] text-[#8EAC24] scale-105'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Check size={14} className={savedStatusB === 'achieved' ? 'animate-in' : ''} />
                  </button>
                </div>
              </div>

              {/* Failed */}
              <div className="space-y-2">
                <p className="label-tiny">Что не получилось и почему?</p>
                <div className="relative">
                  <textarea
                    value={resultsB.notAchieved}
                    onChange={(e) => setResultsB({ ...resultsB, notAchieved: e.target.value })}
                    rows={4}
                    className="w-full p-4 pr-12 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-purple-200 resize-none font-medium text-slate-700 leading-relaxed shadow-sm transition-all"
                  />
                  <button
                    onClick={() => fixResultB('failed')}
                    className={`absolute top-3 right-3 p-2 rounded-xl shadow-sm transition-all active:scale-90 ${
                      savedStatusB === 'failed'
                        ? 'bg-[#D9FF5F] text-[#8EAC24] scale-105'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Check size={14} className={savedStatusB === 'failed' ? 'animate-in' : ''} />
                  </button>
                </div>
              </div>

              {/* Analysis */}
              <div className="space-y-2">
                <p className="label-tiny">Анализ пройденного пути</p>
                <div className="relative">
                  <textarea
                    value={resultsB.analysis}
                    onChange={(e) => setResultsB({ ...resultsB, analysis: e.target.value })}
                    rows={4}
                    className="w-full p-4 pr-12 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-purple-200 resize-none font-medium text-slate-700 leading-relaxed italic shadow-sm transition-all"
                  />
                  <button
                    onClick={() => fixResultB('analysis')}
                    className={`absolute top-3 right-3 p-2 rounded-xl shadow-sm transition-all active:scale-90 ${
                      savedStatusB === 'analysis'
                        ? 'bg-[#D9FF5F] text-[#8EAC24] scale-105'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <Check size={14} className={savedStatusB === 'analysis' ? 'animate-in' : ''} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
