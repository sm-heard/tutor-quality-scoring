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
          <div className="flex flex-1 flex-col">
            <header className="flex flex-col gap-4 border-b px-4 py-4 md:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tutor Quality
                  </div>
                  <div className="text-base font-semibold text-foreground">
                    Scoring System
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
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                    >
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </header>
            <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
