"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Download, BarChart3, TrendingUp, TrendingDown, Package, DollarSign, CreditCard } from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "../../shared/components/ui/card"
import { Button } from "../../shared/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/components/ui/table"
import { Badge } from "../../shared/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../shared/components/ui/tabs"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../shared/components/ui/tooltip"
import { api } from "../../shared/utils/api"
import { formatCurrency, formatNumber, formatDate } from "../../shared/utils/format"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"

const periods = [
  { value: "daily", label: "reports.daily" },
  { value: "weekly", label: "reports.weekly" },
  { value: "monthly", label: "reports.monthly" },
  { value: "6months", label: "reports.sixMonths" },
  { value: "yearly", label: "reports.yearly" },
]

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

export default function ReportsPage() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState("monthly")
  const [activeTab, setActiveTab] = useState("sales")

  const { data: salesReport } = useQuery({
    queryKey: ["sales-report", period],
    queryFn: () => api.get("/reports/sales", { params: { period } }).then(res => res.data),
  })

  const { data: inventoryReport } = useQuery({
    queryKey: ["inventory-report"],
    queryFn: () => api.get("/reports/inventory").then(res => res.data),
  })

  const { data: profitLoss } = useQuery({
    queryKey: ["profit-loss", period],
    queryFn: () => api.get("/reports/profit-loss", { params: { period } }).then(res => res.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("navigation.reports")}</h1>
          <p className="text-muted-foreground">{t("reports.title")}</p>
        </div>
        <div className="flex gap-2">
          <Tooltip content={t("tooltips.period")}>
            <TooltipTrigger asChild>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t("reports.period")} />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{t(p.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TooltipTrigger>
          </Tooltip>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t("reports.export")}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">{t("reports.salesReport")}</TabsTrigger>
          <TabsTrigger value="inventory">{t("reports.inventoryReport")}</TabsTrigger>
          <TabsTrigger value="profit-loss">{t("reports.profitLoss")}</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          {salesReport && (
            <>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.revenue")}</CardTitle>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(salesReport.summary?.totalAmount || 0)}</div>
                    <div className="text-sm text-muted-foreground">{salesReport.summary?.count || 0} {t("common.count")}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.totalDiscount")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{formatCurrency(salesReport.summary?.totalDiscount || 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.totalTax")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{formatCurrency(salesReport.summary?.totalTax || 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.totalItems")}</CardTitle>
                    <Package className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatNumber(salesReport.summary?.totalItems || 0)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("reports.byDay")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesReport.byDay || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(v) => formatDate(v)} />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                        <RechartsTooltip formatter={(v: number) => [formatCurrency(v), t("reports.revenue")]} />
                        <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("reports.byCategory")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={salesReport.byCategory || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="total"
                          nameKey="category"
                          label={({ category, total, percent }) => `${category}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {(salesReport.byCategory || []).map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(v: number) => [formatCurrency(v), t("reports.revenue")]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{t("reports.paymentMethods")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("reports.paymentMethods")}</TableHead>
                        <TableHead className="text-left">{t("common.count")}</TableHead>
                        <TableHead className="text-left">{t("reports.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReport.paymentMethods?.map((method: any) => (
                        <TableRow key={method.method}>
                          <TableCell>
                            <Badge variant="outline">{t(`debts.${method.method.toLowerCase()}`)}</Badge>
                          </TableCell>
                          <TableCell className="text-left">{method.count}</TableCell>
                          <TableCell className="text-left font-medium">{formatCurrency(method.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="inventory">
          {inventoryReport && (
            <>
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.inventoryValuation")}</CardTitle>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(inventoryReport.valuation?.totalValue || 0)}</div>
                    <div className="text-sm text-muted-foreground">{formatNumber(inventoryReport.valuation?.totalQuantity || 0)} {t("common.items")}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.avgCost")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(inventoryReport.valuation?.averageCost || 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.byCategory")}</CardTitle>
                    <Package className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{inventoryReport.byCategory?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">{t("common.categories")}</div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-red-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.expiringProducts")}</CardTitle>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{inventoryReport.expiring?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">{t("reports.expiringProducts")}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("reports.inventoryByCategory")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={inventoryReport.byCategory || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" tickFormatter={(v) => t(`products.${v.toLowerCase()}`)} />
                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                        <RechartsTooltip formatter={(v: number) => [formatCurrency(v), t("reports.value")]} />
                        <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("reports.expiringProducts")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("products.tradeName")}</TableHead>
                          <TableHead>{t("inventory.batchNumber")}</TableHead>
                          <TableHead className="text-left">{t("inventory.quantity")}</TableHead>
                          <TableHead className="text-left">{t("inventory.expiryDate")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryReport.expiring?.slice(0, 10).map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product.tradeName}</TableCell>
                            <TableCell className="font-mono">{item.batchNumber}</TableCell>
                            <TableCell className="text-left">{formatNumber(item.quantity)} {item.product.unitType}</TableCell>
                            <TableCell className="text-left text-red-600">{formatDate(item.expiryDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{t("reports.stockMovements")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead>{t("products.tradeName")}</TableHead>
                        <TableHead>{t("inventory.movementType")}</TableHead>
                        <TableHead className="text-left">{t("inventory.quantity")}</TableHead>
                        <TableHead className="text-left">{t("inventory.reference")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryReport.movements?.slice(0, 20).map((movement: any) => (
                        <TableRow key={movement.id}>
                          <TableCell>{formatDate(movement.createdAt)}</TableCell>
                          <TableCell>{movement.product.tradeName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{movement.type}</Badge>
                          </TableCell>
                          <TableCell className="text-left">
                            <span className={movement.type === "IN" ? "text-green-600" : "text-red-600"}>
                              {movement.type === "IN" ? "+" : "-"}{formatNumber(movement.quantity)}
                            </span>
                          </TableCell>
                          <TableCell className="text-left text-sm text-muted-foreground">
                            {movement.referenceType} {movement.referenceId?.slice(0, 8)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="profit-loss">
          {profitLoss && (
            <>
              <div className="grid gap-4 md:grid-cols-5 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.revenue")}</CardTitle>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(profitLoss.revenue || 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.costOfGoods")}</CardTitle>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{formatCurrency(profitLoss.cogs || 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.grossProfit")}</CardTitle>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{formatCurrency(profitLoss.grossProfit || 0)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.expenses")}</CardTitle>
                    <CreditCard className="h-5 w-5 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{formatCurrency(profitLoss.expenses || 0)}</div>
                  </CardContent>
                </Card>
                <Card className={profitLoss.netProfit >= 0 ? "border-l-4 border-green-500" : "border-l-4 border-red-500"}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("reports.netProfit")}</CardTitle>
                    {profitLoss.netProfit >= 0 ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${profitLoss.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(profitLoss.netProfit || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">هامش: {profitLoss.margin?.toFixed(1)}%</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{t("reports.profitLoss")} - {t(`reports.${period}`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: t("reports.revenue"), value: profitLoss.revenue || 0 },
                      { name: t("reports.costOfGoods"), value: profitLoss.cogs || 0 },
                      { name: t("reports.grossProfit"), value: profitLoss.grossProfit || 0 },
                      { name: t("reports.expenses"), value: profitLoss.expenses || 0 },
                      { name: t("reports.netProfit"), value: profitLoss.netProfit || 0 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => formatCurrency(v)} />
                      <RechartsTooltip formatter={(v: number) => [formatCurrency(v), ""]} />
                      <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}