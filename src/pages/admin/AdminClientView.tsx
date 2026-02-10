import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Map, Heart, FileText, Zap, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminClientView = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [volcanoes, setVolcanoes] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) loadClientData(userId);
  }, [userId]);

  const loadClientData = async (uid: string) => {
    const [profileRes, goalsRes, roadmapsRes, sessionsRes, diaryRes, volcanoesRes, metricsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('goals').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('roadmaps').select('*, roadmap_steps(*)').eq('user_id', uid).order('created_at'),
      supabase.from('sessions').select('*').eq('user_id', uid).order('session_number', { ascending: false }),
      supabase.from('diary_entries').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10),
      supabase.from('volcanoes').select('*').eq('user_id', uid),
      supabase.from('progress_metrics').select('*').eq('user_id', uid),
    ]);

    setProfile(profileRes.data);
    setGoals(goalsRes.data ?? []);
    setRoadmaps(roadmapsRes.data ?? []);
    setSessions(sessionsRes.data ?? []);
    setDiaryEntries(diaryRes.data ?? []);
    setVolcanoes(volcanoesRes.data ?? []);
    setMetrics(metricsRes.data ?? []);
    setLoading(false);
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

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Icon size={16} className="text-secondary" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );

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

      {/* Roadmaps */}
      <Section title="Дорожные карты" icon={Map}>
        {roadmaps.length === 0 ? (
          <p className="text-xs text-muted-foreground">Карт нет</p>
        ) : (
          roadmaps.map((r) => (
            <div key={r.id} className="glass card-round p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">{r.title}</p>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{r.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{r.description}</p>
              {r.roadmap_steps?.map((s: any) => (
                <div key={s.id} className="flex items-center space-x-2 text-xs">
                  <span className={s.done ? 'text-lime-dark' : 'text-muted-foreground'}>{s.done ? '✓' : '○'}</span>
                  <span className={s.done ? 'line-through text-muted-foreground' : 'text-foreground'}>{s.text}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </Section>

      {/* Sessions */}
      <Section title="Сессии" icon={FileText}>
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Сессий нет</p>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="glass card-round p-3 space-y-1">
              <p className="text-sm font-bold text-foreground">Сессия {s.session_number}</p>
              <p className="text-[10px] text-muted-foreground">{s.session_date} · {s.session_time}</p>
              <p className="text-xs text-foreground">{s.summary}</p>
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
