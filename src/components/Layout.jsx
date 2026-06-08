import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutTemplate, Settings, LogOut, Moon, Menu, X, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/reports', label: 'Relatórios', icon: BarChart2 },
  { to: '/settings', label: 'Conexão Meta', icon: Settings }
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <div className="flex items-center gap-2">
          <Moon size={18} className="text-accent2" />
          <span className="font-display font-bold">Luna</span>
          <span className="font-mono text-[0.6rem] text-muted">TEMPLATES</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-muted hover:text-text p-1"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:sticky top-0 left-0 h-screen bg-surface border-r border-border flex flex-col z-40 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className={`pt-7 pb-5 border-b border-border relative ${collapsed ? 'px-0 flex justify-center' : 'px-6'}`}>
          {collapsed ? (
            <Moon size={20} className="text-accent2" />
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Moon size={20} className="text-accent2" />
                <h1 className="font-display text-xl font-extrabold tracking-tight">Luna</h1>
              </div>
              <p className="font-mono text-[0.6rem] tracking-widest text-muted">
                WABA TEMPLATES · HPRIME
              </p>
              <span className="inline-block mt-3 font-mono text-[0.6rem] tracking-widest px-2 py-0.5 rounded bg-accent/15 text-accent2 border border-accent/30">
                v1.0
              </span>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {!collapsed && (
            <div className="px-6 pb-2 font-mono text-[0.58rem] tracking-widest uppercase text-muted">
              Navegação
            </div>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 font-mono text-xs border-l-2 transition-all ${
                  collapsed ? 'justify-center px-0 border-l-0 border-transparent mx-2 rounded-md' : 'px-6'
                } ${
                  isActive
                    ? collapsed
                      ? 'bg-accent/10 text-text'
                      : 'border-accent text-text bg-accent/[0.06]'
                    : 'border-transparent text-muted hover:text-text hover:bg-white/[0.02]'
                }`
              }
            >
              <item.icon size={14} />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`py-4 border-t border-border ${collapsed ? 'px-0 flex flex-col items-center gap-2' : 'px-6'}`}>
          {!collapsed && (
            <p className="font-mono text-[0.65rem] text-muted truncate mb-2">
              {user?.email}
            </p>
          )}
          <button
            onClick={handleSignOut}
            title={collapsed ? 'Sair' : undefined}
            className={`flex items-center justify-center gap-2 py-2 rounded-md border border-border2 text-muted hover:text-red hover:border-red/40 text-xs transition-all ${
              collapsed ? 'w-9 h-9 p-0' : 'w-full'
            }`}
          >
            <LogOut size={12} />
            {!collapsed && 'Sair'}
          </button>
        </div>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 items-center justify-center rounded-full bg-surface border border-border text-muted hover:text-text hover:border-border2 transition-all z-50"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-5 md:px-10 py-8 md:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
