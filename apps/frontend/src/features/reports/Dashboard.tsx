"use client"

import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight, ArrowDownRight, Users, Package, AlertTriangle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card"
import { Badge } from "../../shared/components/ui/badge"
import { Button } from "../../shared/components/ui/button"
import { api } from "../../shared/utils/api"
import { formatNumber, formatCurrency } from "../../shared/utils/format"

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; label: string }
  className?: string
  tooltip?: string
}

function KPICard({ title, value, icon, trend, className, tooltip }: KPICardProps) {
  const { t } = useTranslation()

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {tooltip && (
          <Badge variant="info" className="cursor-help">
            <span className="h-4 w-4" data-tooltip={tooltip} />
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold">{value}</div>
          <div className={cn("text-sm font-medium", trend && trend.value >= 0 ? "text-green-600" : "text-red-600")}>
            {trend && (
              <>
                {trend.value >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {Math.abs(trend.value)}% {trend.label}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">{icon}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentSalesTable({ sales }: { sales: any[] }) {
  const { t } = useTranslation()

  if (!sales.length) {
    return <div className="text-center py-8 text-muted-foreground">{t("dashboard.noData")}</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-right text-sm text-muted-foreground">
            <th className="pb-3 font-medium">{t("dashboard.recentSales")}</th>
            <th className="pb-3 font-medium text-left">{t("common.customer")}</th>
            <th className="pb-3 font-medium text-left">{t("common.total")}</th>
            <th className="pb-3 font-medium text-left">{t("common.items")}</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale: any) => (
            <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-3 text-sm">{new Date(sale.saleDate).toLocaleDateString("ar-EG")}</td>
              <td className="py-3 text-sm text-left">{sale.customer?.name || t("sales.walkIn")}</td>
              <td className="py-3 text-sm font-medium text-left">{formatCurrency(sale.totalAmount)}</td>
              <td className="py-3 text-sm text-left text-muted-foreground">{sale.itemsCount} {t("common.items")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TopProductsTable({ products }: { products: any[] }) {
  const { t } = useTranslation()

  if (!products.length) {
    return <div className="text-center py-8 text-muted-foreground">{t("dashboard.noData")}</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-right text-sm text-muted-foreground">
            <th className="pb-3 font-medium">#</th>
            <th className="pb-3 font-medium">{t("products.tradeName")}</th>
            <th className="pb-3 font-medium text-left">{t("reports.quantity")}</th>
            <th className="pb-3 font-medium text-left">{t("reports.revenue")}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product: any, index: number) => (
            <tr key={product.name} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-3 text-sm font-medium">{index + 1}</td>
              <td className="py-3 text-sm">{product.name}</td>
              <td className="py-3 text-sm text-left">{product.quantity} {product.unit}</td>
              <td className="py-3 text-sm font-medium text-left">{formatCurrency(product.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/reports/dashboard").then(res => res.data),
    enabled: !!localStorage.getItem("clerk_token"),
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    )
  }

  const kpis = dashboard?.kpis || {}
  const recentSales = dashboard?.recentSales || []
  const topProducts = dashboard?.topProducts || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("navigation.dashboard")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="hidden sm:flex">{t("dashboard.newSale")}</Button>
          <Button variant="outline" className="hidden sm:flex">{t("dashboard.newProduct")}</Button>
          <Button variant="outline" className="hidden sm:flex">{t("dashboard.newCustomer")}</Button>
          <Button>{t("dashboard.receiveStock")}</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={t("dashboard.todayRevenue")}
          value={formatCurrency(kpis.todayRevenue || 0)}
          icon={<ArrowUpRight className="h-5 w-5 text-green-600" />}
          tooltip={t("tooltips.saleDiscount")}
        />
        <KPICard
          title={t("dashboard.weekRevenue")}
          value={formatCurrency(kpis.weekRevenue || 0)}
          icon={<ArrowUpRight className="h-5 w-5 text-green-600" />}
        />
        <KPICard
          title={t("dashboard.monthRevenue")}
          value={formatCurrency(kpis.monthRevenue || 0)}
          icon={<ArrowUpRight className="h-5 w-5 text-green-600" />}
        />
        <KPICard
          title={t("dashboard.totalProducts")}
          value={formatNumber(kpis.totalProducts || 0)}
          icon={<Package className="h-5 w-5 text-blue-600" />}
        />
        <KPICard
          title={t("dashboard.lowStock")}
          value={kpis.lowStockCount || 0}
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          className="border-l-4 border-orange-500"
        />
        <KPICard
          title={t("dashboard.pendingDebts")}
          value={formatCurrency(kpis.pendingDebts || 0)}
          icon={<Users className="h-5 w-5 text-purple-600" />}
        />
        <KPICard
          title={t("dashboard.expiringSoon")}
          value={kpis.expiringSoon || 0}
          icon={<Clock className="h-5 w-5 text-red-600" />}
          className="border-l-4 border-red-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{t("dashboard.recentSales")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSalesTable sales={recentSales} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t("dashboard.topProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsTable products={topProducts} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { cn } from "../../shared/utils/cn"