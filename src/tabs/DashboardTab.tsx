import { Navigation, ChevronRight, Flag, Rocket, ArrowRight, Pencil, Plus, MessageSquare, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
}: DashboardTabProps) => {
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
          <div key={s.number} className={`p-5 card-round bg-gradient-to-r ${s.gradient} space-y-3`}>
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
            {s.files.length > 0 && (
              <div className="flex items-center space-x-2 flex-wrap">
                {s.files.map((f, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      const { data } = await supabase.storage.from('mentoring-files').createSignedUrl(f, 3600);
                      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                    }}
                    className="flex items-center space-x-1 text-secondary text-xs font-medium hover:text-secondary/80 transition-colors bg-transparent border-none p-0 cursor-pointer"
                  >
                    <FileText size={14} />
                    <span>📎 Файл {i + 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};

export default DashboardTab;
