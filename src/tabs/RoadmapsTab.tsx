import { useState } from 'react';
import { CheckCircle2, Circle, Trash2, Plus, Pencil, X } from 'lucide-react';
import type { Roadmap } from '@/types/mentoring';

interface RoadmapsTabProps {
  roadmaps: Roadmap[];
  onUpdateRoadmaps: (roadmaps: Roadmap[]) => void;
}

const RoadmapsTab = ({ roadmaps, onUpdateRoadmaps }: RoadmapsTabProps) => {
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<number | null>(null);

  const selectedRoadmap = roadmaps.find((rm) => rm.id === selectedRoadmapId);

  const updateStep = (roadmapId: number, stepIndex: number, fields: Partial<{ text: string; done: boolean; deadline: string }>) => {
    onUpdateRoadmaps(
      roadmaps.map((rm) => {
        if (rm.id === roadmapId) {
          const newSteps = [...rm.steps];
          newSteps[stepIndex] = { ...newSteps[stepIndex], ...fields };
          return { ...rm, steps: newSteps };
        }
        return rm;
      })
    );
  };

  const addStep = (roadmapId: number) => {
    onUpdateRoadmaps(
      roadmaps.map((rm) => {
        if (rm.id === roadmapId) {
          return { ...rm, steps: [...rm.steps, { text: '', done: false, deadline: '' }] };
        }
        return rm;
      })
    );
  };

  const removeStep = (roadmapId: number, stepIndex: number) => {
    onUpdateRoadmaps(
      roadmaps.map((rm) => {
        if (rm.id === roadmapId) {
          return { ...rm, steps: rm.steps.filter((_, i) => i !== stepIndex) };
        }
        return rm;
      })
    );
  };

  const statusColor = (status: string) => {
    if (status === 'Завершена') return 'bg-emerald-100 text-emerald-700';
    if (status === 'В работе') return 'bg-primary/30 text-lime-dark';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4 animate-in">
      <h2 className="text-xl font-black text-foreground">Дорожные карты</h2>

      {roadmaps.map((rm) => (
        <div key={rm.id} className="glass card-round-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">{rm.title}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${statusColor(rm.status)}`}>
              {rm.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{rm.description}</p>
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${rm.steps.length > 0 ? (rm.steps.filter((s) => s.done).length / rm.steps.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">
              {rm.steps.filter((s) => s.done).length}/{rm.steps.length}
            </span>
          </div>
          <button
            onClick={() => setSelectedRoadmapId(rm.id)}
            className="flex items-center space-x-1 text-secondary text-xs font-bold hover:text-secondary/80 transition-colors"
          >
            <Pencil size={12} />
            <span>Редактировать шаги</span>
          </button>
        </div>
      ))}

      {/* Roadmap Detail Modal */}
      {selectedRoadmap && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in">
          <div className="glass-strong card-round-lg w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">{selectedRoadmap.title}</h2>
                <p className="text-xs text-muted-foreground font-medium">План действий</p>
              </div>
              <button onClick={() => setSelectedRoadmapId(null)} className="text-muted-foreground hover:text-foreground p-2">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="label-tiny">Список шагов:</p>
                <button
                  onClick={() => addStep(selectedRoadmap.id)}
                  className="flex items-center space-x-1 text-[10px] font-bold uppercase text-secondary hover:text-secondary/80"
                >
                  <Plus size={12} />
                  <span>Добавить шаг</span>
                </button>
              </div>

              {selectedRoadmap.steps.map((step, i) => (
                <div key={i} className="relative group p-4 card-round bg-background/60 space-y-2">
                  <button
                    onClick={() => removeStep(selectedRoadmap.id, i)}
                    className="absolute -top-2 -right-2 p-2 bg-rose-50 text-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => updateStep(selectedRoadmap.id, i, { done: !step.done })}
                      className={`mt-1 transition-colors ${step.done ? 'text-emerald-500' : 'text-muted-foreground/30'}`}
                    >
                      {step.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <textarea
                      value={step.text}
                      onChange={(e) => updateStep(selectedRoadmap.id, i, { text: e.target.value })}
                      placeholder="описание шага..."
                      className={`flex-1 text-sm font-medium bg-transparent border-none focus:ring-0 p-0 resize-none focus:outline-none ${
                        step.done ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-1 border-t border-muted/50">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Дедлайн:</span>
                    <input
                      type="date"
                      value={step.deadline}
                      onChange={(e) => updateStep(selectedRoadmap.id, i, { deadline: e.target.value })}
                      className="bg-transparent border-none p-0 text-[10px] font-bold text-secondary focus:ring-0 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedRoadmapId(null)}
              className="w-full py-5 btn-dark"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapsTab;
