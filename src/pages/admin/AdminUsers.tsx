import { useEffect, useState } from 'react';
import { Search, UserPlus, ShieldOff, Shield, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ModalOverlay from '@/components/ModalOverlay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_blocked: boolean;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id').eq('role', 'super_admin'),
      ]);

      const adminIds = new Set((roles ?? []).map((r) => r.user_id));
      setUsers((profiles ?? []).filter((p) => !adminIds.has(p.user_id)));
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setLoading(false);
  };

  const toggleBlock = async (profile: UserProfile) => {
    try {
      await supabase.from('profiles').update({ is_blocked: !profile.is_blocked }).eq('id', profile.id);
      setUsers(users.map(u => u.id === profile.id ? { ...u, is_blocked: !u.is_blocked } : u));
    } catch (err) {
      console.error('Failed to toggle block:', err);
    }
  };

  const handleDeleteUser = async (profile: UserProfile) => {
    try {
      const res = await supabase.functions.invoke('delete-user', {
        body: { user_id: profile.user_id },
      });
      if (res.error || res.data?.error) {
        console.error('Delete failed:', res.data?.error || res.error?.message);
        return;
      }
      setUsers(prev => prev.filter(u => u.id !== profile.id));
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setDeletingUser(null);
    }
  };

  const handleAddUser = async () => {
    if (!newEmail || !newPassword) {
      setAddError('Заполните email и пароль');
      return;
    }
    setAdding(true);
    setAddError('');

    const res = await supabase.functions.invoke('create-user', {
      body: { email: newEmail, password: newPassword, full_name: newName },
    });

    if (res.error || res.data?.error) {
      setAddError(res.data?.error || res.error?.message || 'Ошибка');
      setAdding(false);
      return;
    }

    setShowAddModal(false);
    setNewEmail('');
    setNewPassword('');
    setNewName('');
    setAdding(false);
    loadUsers();
  };

  const filtered = users.filter(u =>
    (u.full_name + u.email).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Пользователи</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-3 btn-dark"
        >
          <UserPlus size={14} />
          <span>Добавить</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени или email..."
          className="input-glass pl-10"
        />
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Не найдено</p>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className="glass card-round p-4 flex items-center space-x-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{u.full_name || 'Без имени'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
              </div>
              <button
                onClick={() => toggleBlock(u)}
                className={`p-2 rounded-xl transition-colors ${
                  u.is_blocked
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground hover:text-destructive'
                }`}
                title={u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
              >
                {u.is_blocked ? <ShieldOff size={16} /> : <Shield size={16} />}
              </button>
              <button
                onClick={() => setDeletingUser(u)}
                className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-destructive transition-colors"
                title="Удалить пользователя"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add user modal */}
      <ModalOverlay isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Новый пользователь">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="label-tiny">Имя</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-glass"
              placeholder="Александра"
            />
          </div>
          <div className="space-y-2">
            <label className="label-tiny">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="input-glass"
              placeholder="email@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="label-tiny">Пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-glass"
              placeholder="минимум 6 символов"
              required
            />
          </div>
          {addError && <p className="text-sm text-destructive font-medium">{addError}</p>}
          <button onClick={handleAddUser} disabled={adding} className="w-full py-4 btn-dark disabled:opacity-50">
            {adding ? 'Создание...' : 'Создать пользователя'}
          </button>
        </div>
      </ModalOverlay>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => { if (!open) setDeletingUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingUser?.full_name || deletingUser?.email} будет удалён навсегда. Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingUser && handleDeleteUser(deletingUser)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;