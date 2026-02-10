import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ProgressMetric } from '@/types/mentoring';

interface MetricRingProps {
  id: string;
  metric: ProgressMetric;
  onEdit: (id: string) => void;
}

const MetricRing = ({ id, metric, onEdit }: MetricRingProps) => {
  const percentage = (metric.current / 10) * 100;
  const circumference = 2 * Math.PI * 37;
  const offset = circumference - (percentage / 100) * circumference;
  const diff = metric.current - metric.previous;

  return (
    <button
      onClick={() => onEdit(id)}
      className="flex flex-col items-center p-4 card-round transition-all hover:scale-105 active:scale-95"
    >
      <div className="relative">
        <svg width={80} height={80} className="transform -rotate-90">
          <circle
            cx={40}
            cy={40}
            r={37}
            stroke="rgba(0,0,0,0.05)"
            strokeWidth={6}
            fill="transparent"
          />
          <circle
            cx={40}
            cy={40}
            r={37}
            stroke="hsl(var(--lime-dark))"
            strokeWidth={6}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-foreground">{metric.current}</span>
        </div>
      </div>
      <div className={`flex items-center text-[10px] font-bold mt-1 ${
        diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-500' : 'text-muted-foreground'
      }`}>
        {diff > 0 ? <TrendingUp size={8} className="mr-0.5" /> :
         diff < 0 ? <TrendingDown size={8} className="mr-0.5" /> :
         <Minus size={8} className="mr-0.5" />}
        {diff !== 0 ? Math.abs(diff) : ''}
      </div>
      <span className="text-[9px] font-bold text-muted-foreground mt-1 text-center leading-tight">
        {metric.label}
      </span>
    </button>
  );
};

export default MetricRing;
