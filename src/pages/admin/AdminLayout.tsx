import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Дашборд' },
  { path: '/admin/users', icon: Users, label: 'Пользователи' },
  { path: '/admin/content', icon: FileText, label: 'Контент' },
];

const AdminLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Check if path matches (exact for /admin, startsWith for others)
  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-muted">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-xl bg-muted">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <h1 className="text-sm font-black text-foreground uppercase tracking-widest">Админ-панель</h1>
          </div>
          <button onClick={handleSignOut} className="flex items-center space-x-2 p-2 rounded-xl text-muted-foreground hover:text-destructive transition-colors">
            <LogOut size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-56 flex-shrink-0 py-6 pr-6">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 top-14 w-64 bg-card rounded-r-3xl shadow-xl p-4 space-y-1 animate-in">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:py-6 md:pl-0 pb-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
