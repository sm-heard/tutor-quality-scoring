import type { Metadata } from "next"
import Link from "next/link"
import { BarChart3, CalendarClock, Users } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"

import "./globals.css"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" as const },
  { href: "/tutors", label: "Tutors", icon: "tutors" as const },
  { href: "/sessions", label: "Sessions", icon: "sessions" as const },
]

const NAV_ICONS = {
  dashboard: BarChart3,
  tutors: Users,
  sessions: CalendarClock,
}

export const metadata: Metadata = {
  title: {
    default: "Tutor Quality Scoring",
    template: "%s · Tutor Quality Scoring",
  },
  description:
    "Monitor tutor performance, risk signals, and coaching opportunities in a single dashboard.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen">
          <AppSidebar items={NAV_ITEMS} />
          <div className="flex flex-1 flex-col relative">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent md:hidden" />

            <header className="flex flex-col gap-4 border-b border-border/50 backdrop-blur-sm bg-card/50 px-4 py-4 md:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/80 font-mono">
                      Observatory
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      Tutor Quality
                    </div>
                  </div>
                </div>
              </div>
              <nav className="flex gap-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = NAV_ICONS[item.icon]
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-card px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                    >
                      {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </header>
            <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
