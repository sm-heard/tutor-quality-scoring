"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BarChart3, CalendarClock, Users } from "lucide-react"

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
    <aside className="hidden border-r bg-card/40 md:flex md:w-64 md:flex-col">
      <div className="border-b px-6 py-5">
        <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tutor Quality
        </div>
        <div className="text-lg font-semibold text-foreground">Scoring System</div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = ICONS[item.icon]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
