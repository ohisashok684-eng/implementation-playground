import { useState } from 'react';
import { Navigation, ChevronRight, Flag, Rocket, ArrowRight, Pencil, Plus, MessageSquare, FileText, ExternalLink, CheckCircle2, Circle, Trash2, X } from 'lucide-react';
import { externalDb } from '@/lib/externalDb';
import { openStorageFile } from '@/lib/openFile';
import MetricRing from '@/components/MetricRing';
import type { Goal, Session, ProgressMetric, RouteInfo } from '@/types/mentoring';

interface DashboardTabProps {
  routeInfo: RouteInfo;
  goals: Goal[];
  sessions: Session[];
  progressMetrics: Record<string, ProgressMetric>;
  onEditRoute: () => void;
  onEditGoal: (goal: Goal) => void;
  onAddGoal: () => void;
  onEditMetric: (id: string) => void;
  onOpenPointA: () => void;
  onOpenPointB: () => void;
  onUpdateSessions: (sessions: Session[]) => void;
}

const formatAmount = (val: string) => {
  if (!val) return '0';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const DashboardTab = ({
  routeInfo,
  goals,
  sessions,
  progressMetrics,
  onEditRoute,
  onEditGoal,
  onAddGoal,
  onEditMetric,
  onOpenPointA,
  onOpenPointB,
  onUpdateSessions,
}: DashboardTabProps) => {
  const [editingStepsSessionId, setEditingStepsSessionId] = useState<string | null>(null);
  const [newStepText, setNewStepText] = useState('');
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [editingStepText, setEditingStepText] = useState('');

  const editingSession = sessions.find(s => s.id === editingStepsSessionId);

  const persistSteps = async (sessionId: string, steps: string[]) => {
    try {
      await externalDb.update('sessions', { steps }, { id: sessionId });
    } catch (err) {
      console.error('Failed to persist steps:', err);
    }
  };

  const addStep = async () => {
    if (!newStepText.trim() || !editingStepsSessionId) return;
    const updated = sessions.map(s => {
      if (s.id === editingStepsSessionId) {
        return { ...s, steps: [...s.steps, newStepText.trim()] };
      }
      return s;
    });
    onUpdateSessions(updated);
    setNewStepText('');
    const session = updated.find(s => s.id === editingStepsSessionId);
    if (session) await persistSteps(editingStepsSessionId, session.steps);
  };

  const removeStep = async (index: number) => {
    if (!editingStepsSessionId) return;
    const updated = sessions.map(s => {
      if (s.id === editingStepsSessionId) {
        return { ...s, steps: s.steps.filter((_, i) => i !== index) };
      }
      return s;
    });
    onUpdateSessions(updated);
    const session = updated.find(s => s.id === editingStepsSessionId);
    if (session) await persistSteps(editingStepsSessionId, session.steps);
  };

  const saveEditStep = async (index: number) => {
    if (!editingStepsSessionId || !editingStepText.trim()) return;
    const updated = sessions.map(s => {
      if (s.id === editingStepsSessionId) {
        const newSteps = [...s.steps];
        newSteps[index] = editingStepText.trim();
        return { ...s, steps: newSteps };
      }
      return s;
    });
    onUpdateSessions(updated);
    setEditingStepIndex(null);
    setEditingStepText('');
    const session = updated.find(s => s.id === editingStepsSessionId);
    if (session) await persistSteps(editingStepsSessionId, session.steps);
  };

  return (
    <div className="space-y-4 animate-in">
      {/* Route Card */}
      <button
        onClick={onEditRoute}
        className="w-full p-6 card-round bg-gradient-to-br from-foreground to-foreground/80 text-white flex items-center justify-between group transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center space-x-4">
          <Navigation size={24} />
          <div className="text-left">
            <h3 className="text-lg font-black">Мой маршрут</h3>
            <p className="text-white/60 text-xs font-medium">Детали и ресурсы пути</p>
          </div>
        </div>
        <ChevronRight size={24} className="text-white/20 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Points A & B */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onOpenPointA} className="p-5 card-round glass flex items-center space-x-3 transition-transform active:scale-95 hover:bg-card">
          <Flag size={18} className="text-secondary" />
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Точка А</p>
            <p className="text-[10px] text-muted-foreground font-medium">исходная</p>
          </div>
        </button>
        <button onClick={onOpenPointB} className="p-5 card-round glass flex items-center space-x-3 transition-transform active:scale-95 hover:bg-card">
          <Rocket size={18} className="text-secondary" />
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Точка Б</p>
            <p className="text-[10px] text-muted-foreground font-medium">итоговая</p>
          </div>
        </button>
      </div>

      {/* Goals */}
      <section className="glass card-round-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-foreground">Текущие цели</h3>
          <button onClick={onAddGoal} className="flex items-center space-x-1 text-secondary text-xs font-bold">
            <Plus size={14} />
            <span>Добавить</span>
          </button>
        </div>
        {goals.map((g) => (
          <div key={g.id} className="p-4 card-round bg-background/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">{g.title}</h4>
                {g.hasAmount && (
                  <p className="text-xs font-bold text-secondary">{formatAmount(g.amount)} ₽</p>
                )}
              </div>
              <button onClick={() => onEditGoal(g)} className="p-2 bg-muted/50 rounded-full text-muted-foreground hover:text-secondary transition-colors">
                <Pencil size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-3">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${g.progress}%` }} />
                </div>
              </div>
              <span className="text-xs font-bold text-muted-foreground">{g.progress}%</span>
            </div>
            <button onClick={() => onEditGoal(g)} className="flex items-center space-x-1 text-muted-foreground hover:text-secondary text-xs font-medium transition-colors">
              <span>Прогресс по цели</span>
              <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </section>

      {/* Progress Metrics */}
      <section className="glass card-round-lg p-5 space-y-3">
        <h3 className="text-base font-black text-foreground">Мое текущее состояние</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(progressMetrics).map((key) => (
            <MetricRing key={key} id={key} metric={progressMetrics[key]} onEdit={onEditMetric} />
          ))}
        </div>
      </section>

      {/* Sessions */}
      <section className="glass card-round-lg p-5 space-y-4">
        <h3 className="text-base font-black text-foreground">История сессий</h3>
        {sessions.map((s) => (
          <div key={s.id} className={`p-5 card-round bg-gradient-to-r ${s.gradient} space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare size={14} className="text-foreground/40" />
                <span className="text-xs font-bold text-foreground">Сессия №{s.number}</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-foreground/60">{s.date}</p>
                <p className="text-[10px] text-foreground/40">{s.time}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground leading-relaxed">«{s.summary}»</p>

            {/* Steps */}
            {s.steps.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-foreground/10">
                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Шаги:</p>
                {s.steps.map((step, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <CheckCircle2 size={14} className="text-foreground/30 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-foreground/80 font-medium leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Edit steps button */}
            <button
              onClick={() => {
                setEditingStepsSessionId(s.id);
                setNewStepText('');
                setEditingStepIndex(null);
              }}
              className="flex items-center space-x-1 text-foreground/50 hover:text-foreground/80 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              <Pencil size={10} />
              <span>Редактировать шаги</span>
            </button>

            {s.files.length > 0 && (
              <div className="space-y-2">
                {s.files.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => openStorageFile(f)}
                    className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-lg bg-foreground text-white"
                  >
                    <ExternalLink size={14} />
                    <span>Открыть файл {s.files.length > 1 ? i + 1 : ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Steps Edit Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in">
          <div className="glass-strong card-round-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">Сессия №{editingSession.number}</h2>
                <p className="text-xs text-muted-foreground font-medium">Шаги после сессии</p>
              </div>
              <button onClick={() => setEditingStepsSessionId(null)} className="text-muted-foreground hover:text-foreground p-2">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {editingSession.steps.map((step, i) => (
                <div key={i} className="relative group p-3 card-round bg-background/60 space-y-2">
                  <button
                    onClick={() => removeStep(i)}
                    className="absolute -top-2 -right-2 p-1.5 bg-destructive/10 text-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                  >
                    <Trash2 size={12} />
                  </button>
                  {editingStepIndex === i ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingStepText}
                        onChange={(e) => setEditingStepText(e.target.value)}
                        className="flex-1 text-sm font-medium bg-transparent border-b border-secondary/50 focus:border-secondary focus:outline-none p-0 text-foreground"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditStep(i);
                          if (e.key === 'Escape') setEditingStepIndex(null);
                        }}
                      />
                      <button onClick={() => saveEditStep(i)} className="text-secondary hover:text-secondary/80">
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingStepIndex(i);
                        setEditingStepText(step);
                      }}
                      className="w-full text-left flex items-start space-x-2"
                    >
                      <Circle size={14} className="text-muted-foreground/30 mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{step}</span>
                    </button>
                  )}
                </div>
              ))}

              {/* Add new step */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  placeholder="Новый шаг..."
                  className="flex-1 input-glass text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addStep();
                  }}
                />
                <button
                  onClick={addStep}
                  disabled={!newStepText.trim()}
                  className="p-2.5 rounded-xl bg-secondary text-secondary-foreground disabled:opacity-40 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={() => setEditingStepsSessionId(null)}
              className="w-full py-5 btn-dark"
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
