/**
 * @fileoverview Sticky sidebar navigation for the dashboard.
 *
 * Visual style mirrors the shared Bymax example-app design system:
 *   - Width: 250px, position sticky on desktop (lg+), fixed overlay on mobile
 *   - Background: rgba(12,12,12,0.98)
 *   - Border-right: rgba(255,255,255,0.08)
 *   - Active nav item: orange text (#ff6224), 2px left orange border, orange tinted bg
 *
 * Routes are grouped by concern: Observe (live signals), Labs (trigger demos),
 * System (raw scrape).
 *
 * Mobile behaviour: hidden when `isOpen=false`, shown as a fixed overlay below
 * the topbar (top: 64px) when `isOpen=true`.
 *
 * @layer components/layout
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  HeartPulse,
  LayoutDashboard,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/*
 * Pure-visual Tailwind class strings hoisted into module-level constants so the
 * behaviourally-distinguishing tokens (brand orange on the active arm, the
 * mobile flex/hidden ternary) stay easy to spot and to test.
 */
const NAV_ITEM_BASE_CLASS =
  'flex items-center gap-3 rounded-lg border-l-2 px-3 py-[10px] text-sm transition-all duration-150'
const NAV_ITEM_INACTIVE_CLASS =
  'border-l-transparent font-normal text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[rgba(255,255,255,0.8)]'
const ICON_BASE_CLASS = 'h-4 w-4 shrink-0'
const ICON_INACTIVE_CLASS = 'text-[rgba(255,255,255,0.4)]'
const NAV_BASE_CLASSES = [
  'flex w-[250px] shrink-0 flex-col border-r border-[rgba(255,255,255,0.08)] bg-[rgba(12,12,12,0.98)]',
  // Mobile: fixed overlay below topbar
  'z-100 fixed left-0 top-16 h-[calc(100vh-64px)] overflow-y-auto',
  // Desktop: sticky in the flex row
  'lg:sticky lg:top-16 lg:h-[calc(100vh-64px)]',
] as const

/** Active-state palette class — brand orange. Pinned by the active-state test. */
const NAV_ITEM_ACTIVE_CLASS =
  'border-l-[#ff6224] bg-[rgba(255,98,36,0.1)] font-semibold text-[#ff6224]'
const ICON_ACTIVE_CLASS = 'text-[#ff6224]'

/** Mobile-visibility classes. Pinned by the isOpen=true / isOpen=false tests. */
const NAV_OPEN_CLASS = 'flex'
const NAV_CLOSED_CLASS = 'hidden lg:flex'

/** Navigation item definition. */
interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** When true, only exact path match marks the item active. */
  exact?: boolean
}

/** Navigation group: a labeled cluster of related routes. */
interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Observe',
    items: [
      { label: 'Overview', href: '/', icon: LayoutDashboard, exact: true },
      { label: 'Latency', href: '/latency', icon: Activity },
      { label: 'Health', href: '/health', icon: HeartPulse },
    ],
  },
  {
    label: 'Labs',
    items: [
      { label: 'Errors', href: '/errors', icon: AlertTriangle },
      { label: 'Pagination', href: '/pagination', icon: Layers },
    ],
  },
  {
    label: 'System',
    items: [{ label: 'Metrics', href: '/metrics', icon: BarChart3 }],
  },
]

interface SidebarNavItemProps {
  item: NavItem
  onNavClick?: () => void
}

/** Single nav item — extracted so the active-state check stays component-scoped. */
function SidebarNavItem({ item, onNavClick }: SidebarNavItemProps) {
  const pathname = usePathname()
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  const Icon = item.icon

  // The conditional spread guards against passing `onClick={undefined}` to
  // Link under `exactOptionalPropertyTypes`; omitting the key entirely is the
  // type-correct way to express "no handler" instead of an explicit undefined.
  const linkExtras = onNavClick !== undefined ? { onClick: onNavClick } : {}
  return (
    <Link
      href={item.href}
      {...linkExtras}
      className={cn(
        NAV_ITEM_BASE_CLASS,
        isActive ? NAV_ITEM_ACTIVE_CLASS : NAV_ITEM_INACTIVE_CLASS,
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={cn(ICON_BASE_CLASS, isActive ? ICON_ACTIVE_CLASS : ICON_INACTIVE_CLASS)} />
      {item.label}
    </Link>
  )
}

interface SidebarProps {
  /** Whether the sidebar overlay is open (controlled by the app shell). */
  isOpen: boolean
  /** Called when a nav link is clicked or the sidebar is dismissed. */
  onNavClick?: () => void
}

/**
 * Sidebar navigation panel, grouped into Observe / Labs / System.
 *
 * @param isOpen     - Controls mobile visibility.
 * @param onNavClick - Closes the mobile overlay on navigation.
 */
export function Sidebar({ isOpen, onNavClick }: SidebarProps) {
  const childExtras = onNavClick !== undefined ? { onNavClick } : {}

  return (
    <nav
      aria-label="Main navigation"
      className={cn(...NAV_BASE_CLASSES, isOpen ? NAV_OPEN_CLASS : NAV_CLOSED_CLASS)}
    >
      <div className="flex h-full flex-col gap-5 px-4 py-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span className="px-3 pb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.3)]">
              {group.label}
            </span>
            {group.items.map((item) => (
              <SidebarNavItem key={item.href} item={item} {...childExtras} />
            ))}
          </div>
        ))}
      </div>
    </nav>
  )
}
