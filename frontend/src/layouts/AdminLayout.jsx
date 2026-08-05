import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { FiBox, FiGrid, FiHome, FiLogOut, FiMenu, FiPackage, FiUsers, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { SITE_NAME } from '../config/site';
import Logo from '../components/ui/Logo';

const navItems = [
  { to: '/admin', icon: FiGrid, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: FiBox, label: 'Products' },
  { to: '/admin/orders', icon: FiPackage, label: 'Orders' },
  { to: '/admin/users', icon: FiUsers, label: 'Users' },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 flex-col border-r border-slate-200/70 bg-white/70 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 lg:flex">
        <Logo label={`${SITE_NAME} Admin`} className="mb-8" textClassName="text-base font-display font-bold" />
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon /> {label}
            </NavLink>
          ))}
          <Link to="/" className="btn-ghost mt-1 justify-start">
            <FiHome /> Store
          </Link>
          <button type="button" onClick={logout} className="btn-ghost justify-start text-red-500">
            <FiLogOut /> Logout ({user?.name})
          </button>
        </nav>
      </aside>

      <div className="flex-1 overflow-auto">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <div>
            <h1 className="font-bold">{SITE_NAME} Admin</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tap menu for navigation</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost rounded-full p-2"
            aria-label="Open admin menu"
          >
            <FiMenu className="text-xl" />
          </button>
        </header>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex items-stretch lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative z-10 h-full w-72 overflow-hidden border-r border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-6 flex items-center justify-between">
                <Logo label={`${SITE_NAME} Admin`} textClassName="text-base font-display font-bold" />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="btn-ghost rounded-full p-2"
                  aria-label="Close menu"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                {navItems.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                      }`
                    }
                  >
                    <Icon /> {label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-6 space-y-3">
                <Link
                  to="/"
                  onClick={() => setSidebarOpen(false)}
                  className="btn-ghost w-full justify-start"
                >
                  <FiHome /> Store
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    logout();
                  }}
                  className="btn-ghost w-full justify-start text-red-500"
                >
                  <FiLogOut /> Logout ({user?.name})
                </button>
              </div>
            </aside>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
