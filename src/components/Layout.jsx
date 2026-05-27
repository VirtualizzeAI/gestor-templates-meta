import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutTemplate, Settings, LogOut, Moon, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/settings', label: 'Conexão Meta', icon: Settings }
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

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
        } md:translate-x-0 fixed md:sticky top-0 left-0 h-screen w-64 bg-surface border-r border-border flex flex-col z-40 transition-transform`}
      >
        <div className="px-6 pt-7 pb-5 border-b border-border">
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
        </div>

        <nav className="flex-1 py-4">
          <div className="px-6 pb-2 font-mono text-[0.58rem] tracking-widest uppercase text-muted">
            Navegação
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-2.5 font-mono text-xs border-l-2 transition-all ${
                  isActive
                    ? 'border-accent text-text bg-accent/[0.06]'
                    : 'border-transparent text-muted hover:text-text hover:bg-white/[0.02]'
                }`
              }
            >
              <item.icon size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-border">
          <p className="font-mono text-[0.65rem] text-muted truncate mb-2">
            {user?.email}
          </p>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-border2 text-muted hover:text-red hover:border-red/40 text-xs"
          >
            <LogOut size={12} />
            Sair
          </button>
        </div>
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
