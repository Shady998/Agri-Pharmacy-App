"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Edit, Eye, RotateCcw, Calendar, Package, UserPlus } from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "../../shared/components/ui/card"
import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/components/ui/table"
import { Badge } from "../../shared/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../shared/components/ui/dialog"
import { Label } from "../../shared/components/ui/label"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../shared/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../shared/components/ui/tabs"
import { api } from "../../shared/utils/api"
import { formatCurrency, formatNumber, formatDate, SaleStatus } from "../../shared/utils/format"
import { SaleForm } from "./SaleForm"
import { toast } from "react-hot-toast"

interface Sale {
  id: string
  totalAmount: number
  discount: number
  tax: number
  status: SaleStatus
  saleDate: string
  notes: string | null
  customer: { id: string; name: string } | null
  createdBy: { name: string }
  items: { id: string; quantity: number; unitPrice: number; total: number; product: { tradeName: string } }[]
}

const saleStatuses = [
  { value: "COMPLETED", label: "sales.completed" },
  { value: "DRAFT", label: "sales.draft" },
  { value: "RETURNED", label: "sales.returned" },
  { value: "CANCELLED", label: "sales.cancelled" },
]

const statusColors: Record<string, "default" | "destructive" | "warning" | "success" | "info"> = {
  COMPLETED: "success",
  DRAFT: "warning",
  RETURNED: "info",
  CANCELLED: "destructive",
}

export default function SalesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [activeTab, setActiveTab] = useState("list")

  const { data, isLoading } = useQuery({
    queryKey: ["sales", search, statusFilter, startDate, endDate],
    queryFn: () => api.get("/sales", { params: { search, status: statusFilter, startDate, endDate } }).then(res => res.data),
  })

  const { data: dailySummary } = useQuery({
    queryKey: ["sales-daily-summary"],
    queryFn: () => api.get("/sales/daily-summary").then(res => res.data),
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.post(`/sales/${id}/return`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["sales-daily-summary"] })
      toast.success(t("sales.saleReturned"))
      setSelectedSale(null)
    },
    onError: (error: any) => toast.error(error.response?.data?.message || t("common.error")),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("navigation.sales")}</h1>
          <p className="text-muted-foreground">{t("sales.title")}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("sales.newSale")}
        </Button>
      </div>

      {dailySummary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("sales.dailySummary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(dailySummary.totalAmount || 0)}</div>
              <div className="text-sm text-muted-foreground">{dailySummary.count} {t("common.count")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("reports.totalItems")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatNumber(dailySummary.totalItems || 0)}</div>
              <div className="text-sm text-muted-foreground">{t("sales.averageOrder")}: {formatCurrency(dailySummary.averageOrder || 0)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">{t("sales.title")}</TabsTrigger>
          <TabsTrigger value="pos">{t("sales.pos")}</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder={t("sales.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("common.all")}</SelectItem>
                      {saleStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <Badge variant={statusColors[status.value]} className="mr-2">{t(status.label)}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder={t("reports.startDate")} className="w-[160px]" />
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder={t("reports.endDate")} className="w-[160px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">{t("common.loading")}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead>{t("customers.name")}</TableHead>
                        <TableHead className="text-left">{t("sales.itemsCount")}</TableHead>
                        <TableHead className="text-left">{t("sales.total")}</TableHead>
                        <TableHead>{t("sales.status")}</TableHead>
                        <TableHead className="text-left">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.data?.map((sale: Sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{formatDate(sale.saleDate)}</TableCell>
                          <TableCell>{sale.customer?.name || t("sales.walkIn")}</TableCell>
                          <TableCell className="text-left">
                            {sale.items.reduce((sum, i) => sum + i.quantity, 0)} {t("common.items")}
                          </TableCell>
                          <TableCell className="text-left font-bold">{formatCurrency(sale.totalAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={statusColors[sale.status]}>{t(`sales.${sale.status.toLowerCase()}`)}</Badge>
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex items-center gap-2">
                              <Tooltip content={t("common.details")}>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => setSelectedSale(sale)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                              </Tooltip>
                              {sale.status === "COMPLETED" && (
                                <Tooltip content={t("sales.returnSale")}>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-orange-600 hover:text-orange-600" onClick={() => setSelectedSale(sale)}>
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pos">
          <Card>
            <CardHeader>
              <CardTitle>{t("sales.pos")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SaleForm
                onSubmit={async (data) => {
                  // This would call the create sale API
                  toast.success(t("sales.saleCreated"))
                }}
                isLoading={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedSale && (
        <Dialog open onOpenChange={open => !open && setSelectedSale(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("sales.saleDetails")} - {selectedSale.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            <DialogContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">{t("common.date")}</span><div>{formatDate(selectedSale.saleDate)}</div></div>
                  <div><span className="text-muted-foreground">{t("customers.name")}</span><div>{selectedSale.customer?.name || t("sales.walkIn")}</div></div>
                  <div><span className="text-muted-foreground">{t("sales.discount")}</span><div>{formatCurrency(selectedSale.discount)}</div></div>
                  <div><span className="text-muted-foreground">{t("sales.tax")}</span><div>{formatCurrency(selectedSale.tax)}</div></div>
                  <div className="col-span-2"><span className="text-muted-foreground">{t("sales.total")}</span><div className="text-2xl font-bold">{formatCurrency(selectedSale.totalAmount)}</div></div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">{t("sales.items")}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("products.tradeName")}</TableHead>
                        <TableHead className="text-left">{t("inventory.quantity")}</TableHead>
                        <TableHead className="text-left">{t("sales.unitPrice")}</TableHead>
                        <TableHead className="text-left">{t("sales.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product.tradeName}</TableCell>
                          <TableCell className="text-left">{formatNumber(item.quantity)}</TableCell>
                          <TableCell className="text-left">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-left font-medium">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {selectedSale.status === "COMPLETED" && (
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedSale(null)}>{t("common.close")}</Button>
                    <Button variant="destructive" onClick={() => {}}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t("sales.returnSale")}
                    </Button>
                  </DialogFooter>
                )}
              </div>
            </DialogContent>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

import { cn } from "../../shared/utils/cn"