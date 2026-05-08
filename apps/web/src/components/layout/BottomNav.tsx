import { NavLink } from 'react-router-dom'
import { Home, Search, Briefcase, MessageCircle, User } from 'lucide-react'
import { clsx } from 'clsx'

interface NavItem {
  to:    string
  icon:  React.ElementType
  label: string
}

const customerNav: NavItem[] = [
  { to: '/home',   icon: Home,          label: 'Home'   },
  { to: '/browse', icon: Search,        label: 'Browse' },
  { to: '/jobs',   icon: Briefcase,     label: 'Jobs'   },
  { to: '/chat',   icon: MessageCircle, label: 'Chat'   },
  { to: '/me',     icon: User,          label: 'Me'     },
]

const workerNav: NavItem[] = [
  { to: '/worker/jobs',      icon: Briefcase,     label: 'Jobs'     },
  { to: '/worker/map',       icon: Search,        label: 'Map'      },
  { to: '/worker/earnings',  icon: Home,          label: 'Earnings' },
  { to: '/worker/profile',   icon: User,          label: 'Profile'  },
]

export function BottomNav({ variant = 'customer' }: { variant?: 'customer' | 'worker' }) {
  const items = variant === 'customer' ? customerNav : workerNav

  return (
    <nav className="bottom-nav safe-bottom">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} className={({ isActive }) =>
          clsx('nav-item', isActive && 'active')
        }>
          <Icon size={22} strokeWidth={1.75} />
          <span className="text-[11px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
