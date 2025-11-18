"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart3, CalendarClock, Users, Activity } from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: "dashboard" | "tutors" | "sessions"
}

type SidebarProps = {
  items: NavItem[]
}

const ICONS = {
  dashboard: BarChart3,
  tutors: Users,
  sessions: CalendarClock,
}

export function AppSidebar({ items }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden border-r bg-sidebar/95 backdrop-blur-sm md:flex md:w-72 md:flex-col relative overflow-hidden">
      {/* Accent glow top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="border-b border-sidebar-border px-6 py-6 relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-primary/80 font-mono">
              Observatory
            </div>
            <div className="text-sm font-bold text-foreground tracking-tight">
              Tutor Quality
            </div>
          </div>
        </div>

        {/* System status indicator */}
        <div className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>System Active</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = ICONS[item.icon]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary shadow-lg shadow-primary/5 border border-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
              )}
            >
              {active && (
                <div className="absolute inset-0 rounded-lg border-glow opacity-50" style={{ color: 'var(--primary)' }} />
              )}
              {Icon ? (
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    active ? "scale-110" : "group-hover:scale-105"
                  )}
                  strokeWidth={2.5}
                />
              ) : null}
              <span className={cn(
                "tracking-wide",
                active && "font-semibold"
              )}>
                {item.label}
              </span>

              {/* Active indicator */}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer accent */}
      <div className="border-t border-sidebar-border px-6 py-4">
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider">
          <div>MONITORING</div>
          <div className="text-primary/60 mt-0.5">v1.0.0</div>
        </div>
      </div>
    </aside>
  )
}
