"use client"

import { useState, useEffect } from "react"
import { Outlet, NavLink, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { MockUserButton } from "../../shared/auth/MockClerkProvider"
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  CreditCard,
  ShoppingCart,
  Receipt,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react"
import { cn } from "../../shared/utils/cn"
import { Button } from "../../shared/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shared/components/ui/select"

const navigation = [
  { name: "navigation.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "navigation.products", href: "/products", icon: Package },
  { name: "navigation.inventory", href: "/inventory", icon: Warehouse },
  { name: "navigation.customers", href: "/customers", icon: Users },
  { name: "navigation.debts", href: "/debts", icon: CreditCard },
  { name: "navigation.sales", href: "/sales", icon: ShoppingCart },
  { name: "navigation.expenses", href: "/expenses", icon: Receipt },
  { name: "navigation.reports", href: "/reports", icon: BarChart3 },
  { name: "navigation.settings", href: "/settings", icon: Settings },
]

export default function Layout() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const isRTL = i18n.language === 'ar'

  // Listen for language changes to update sidebar position
  useEffect(() => {
    // Force re-render when language changes
  }, [i18n.language])

  const sidebarSide = isRTL ? 'right' : 'left'
  const contentPaddingSide = isRTL ? 'pr' : 'pl'

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex h-full flex-col bg-card border-r transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          sidebarSide === 'right' ? "right-0" : "left-0",
          sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <h1 className="text-xl font-bold text-primary">صيدلية الزهراء</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground"
          >
            {collapsed ? (
              isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/")
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? t(item.name) : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>{t(item.name)}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <NavLink
            to="/users"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === "/users"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center"
            )}
            title={collapsed ? t("navigation.users") : undefined}
          >
            <Users className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            {!collapsed && <span>{t("navigation.users")}</span>}
          </NavLink>
        </div>
      </aside>

      <div className={cn("flex flex-1 flex-col transition-all duration-300", collapsed ? "lg:pl-16 lg:pr-16" : "lg:pl-64 lg:pr-64")}>
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <Select value={i18n.language} onValueChange={lng => i18n.changeLanguage(lng)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>

            <MockUserButton />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6" id="main-content">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}