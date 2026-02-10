import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Target, FileText, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClientSummary {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_blocked: boolean;
  goals_count: number;
  sessions_count: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0, sessions: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load profiles (excluding super_admins)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, is_blocked');

    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin');

    const adminIds = new Set(adminRoles?.map(r => r.user_id) ?? []);
    const userProfiles = (profiles ?? []).filter(p => !adminIds.has(p.user_id));

    // Count goals and sessions per user
    const summaries: ClientSummary[] = [];
    let totalSessions = 0;

    for (const p of userProfiles) {
      const { count: goalsCount } = await supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', p.user_id);

      const { count: sessionsCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', p.user_id);

      totalSessions += sessionsCount ?? 0;
      summaries.push({
        ...p,
        goals_count: goalsCount ?? 0,
        sessions_count: sessionsCount ?? 0,
      });
    }

    setClients(summaries);
    setStats({
      total: summaries.length,
      active: summaries.filter(c => !c.is_blocked).length,
      blocked: summaries.filter(c => c.is_blocked).length,
      sessions: totalSessions,
    });
    setLoading(false);
  };

  const statCards = [
    { label: 'Всего клиентов', value: stats.total, icon: Users, color: 'text-secondary' },
    { label: 'Активных', value: stats.active, icon: Activity, color: 'text-lime-dark' },
    { label: 'Заблокировано', value: stats.blocked, icon: Users, color: 'text-destructive' },
    { label: 'Сессий проведено', value: stats.sessions, icon: FileText, color: 'text-amber-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-foreground">Дашборд</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="glass card-round p-4 space-y-2">
            <s.icon size={20} className={s.color} />
            <p className="text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Client list */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Клиенты</h2>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Клиентов пока нет</p>
        ) : (
          clients.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/admin/clients/${c.user_id}`)}
              className="w-full glass card-round p-4 flex items-center space-x-3 text-left hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {c.full_name || c.email}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {c.goals_count} целей · {c.sessions_count} сессий
                  {c.is_blocked && <span className="text-destructive ml-2">· Заблокирован</span>}
                </p>
              </div>
              <Target size={16} className="text-muted-foreground flex-shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
