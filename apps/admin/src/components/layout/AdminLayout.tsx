import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, CheckSquare, AlertTriangle, CreditCard, Users, Tag, FileText } from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { to: '/overview',      icon: LayoutDashboard, label: 'Overview'      },
  { to: '/verifications', icon: CheckSquare,     label: 'Verifications' },
  { to: '/disputes',      icon: AlertTriangle,   label: 'Disputes'      },
  { to: '/payouts',       icon: CreditCard,      label: 'Payouts'       },
  { to: '/users',         icon: Users,           label: 'Users'         },
  { to: '/categories',    icon: Tag,             label: 'Categories'    },
  { to: '/audit',         icon: FileText,        label: 'Audit log'     },
]

export default function AdminLayout() {
  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-white border-r border-gray-200 flex flex-col py-4">
        <div className="flex items-center gap-2 px-4 mb-6">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Mx</span>
          </div>
          <div>
            <p className="font-bold text-sm">MyExpert · Ops</p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 flex-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              clsx('sidebar-item', isActive && 'active')
            }>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-200 rounded-full" />
            <div>
              <p className="text-xs font-medium text-gray-700">Ops Admin</p>
              <p className="text-[10px] text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
