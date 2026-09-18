"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Filter, Truck, Minus, RotateCcw, AlertTriangle, Calendar } from "lucide-react"
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
import { formatNumber, formatCurrency, StockMovementType } from "../../shared/utils/format"
import { ReceiveStockForm } from "./ReceiveStockForm"
import { AdjustStockForm } from "./AdjustStockForm"
import { toast } from "react-hot-toast"

interface InventoryBatch {
  id: string
  batchNumber: string
  quantity: number
  unitCost: number
  expiryDate: string | null
  receivedAt: string
  product: { id: string; tradeName: string; unitType: string; minThreshold: number }
}

interface StockMovement {
  id: string
  type: StockMovementType
  quantity: number
  referenceType: string | null
  referenceId: string | null
  notes: string | null
  createdAt: string
  product: { tradeName: string }
  batch: { batchNumber: string } | null
}

export default function InventoryPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [expiringOnly, setExpiringOnly] = useState(false)
  const [activeTab, setActiveTab] = useState("batches")

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["inventory-summary"],
    queryFn: () => api.get("/inventory/summary").then(res => res.data),
  })

  const { data: batchesData, isLoading: batchesLoading } = useQuery({
    queryKey: ["inventory-batches", search, expiringOnly],
    queryFn: () => api.get("/inventory/batches", {
      params: { search, expiringSoon: expiringOnly },
    }).then(res => res.data),
  })

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ["stock-movements", search],
    queryFn: () => api.get("/inventory/movements", { params: { search } }).then(res => res.data),
  })

  const receiveMutation = useMutation({
    mutationFn: (data: any) => api.post("/inventory/batches", data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-batches"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
      toast.success(t("inventory.batchCreated"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const adjustMutation = useMutation({
    mutationFn: (data: any) => api.post("/inventory/adjust", data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-batches"] })
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] })
      toast.success(t("inventory.stockAdjusted"))
    },
    onError: (error: any) => toast.error(error.response?.data?.message || t("common.error")),
  })

  const movementTypeLabels: Record<string, string> = {
    IN: t("inventory.movementIn"),
    OUT: t("inventory.movementOut"),
    ADJUSTMENT: t("inventory.movementAdjustment"),
    TRANSFER: t("inventory.movementTransfer"),
    RETURN: t("inventory.movementReturn"),
    EXPIRED: t("inventory.movementExpired"),
    DAMAGED: t("inventory.movementDamaged"),
  }

  const movementTypeIcons: Record<string, any> = {
    IN: Truck,
    OUT: Minus,
    ADJUSTMENT: RotateCcw,
    RETURN: RotateCcw,
  }

  if (summaryLoading) {
    return <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Card key={i}><CardContent className="h-24 animate-pulse"/></Card>)}</div>
  }

  const stats = summary || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("navigation.inventory")}</h1>
          <p className="text-muted-foreground">{t("inventory.title")}</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("inventory.receiveStock")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("inventory.receiveStock")}</DialogTitle>
              </DialogHeader>
              <ReceiveStockForm onSubmit={receiveMutation.mutate} isLoading={receiveMutation.isPending} />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("inventory.adjustStock")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("inventory.adjustStock")}</DialogTitle>
              </DialogHeader>
              <AdjustStockForm onSubmit={adjustMutation.mutate} isLoading={adjustMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("inventory.totalProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProducts || 0}</div>
            <Package className="h-5 w-5 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("inventory.totalBatches")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBatches || 0}</div>
            <Truck className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("inventory.lowStockCount")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.lowStockCount || 0}</div>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("inventory.expiringSoonCount")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.expiringSoon || 0}</div>
            <Calendar className="h-5 w-5 text-red-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="batches">{t("inventory.batches")}</TabsTrigger>
            <TabsTrigger value="movements">{t("inventory.movements")}</TabsTrigger>
          </TabsList>

          <TabsContent value="batches">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Tooltip content={t("inventory.filterExpiring")}>
                  <TooltipTrigger asChild>
                    <Button variant={expiringOnly ? "default" : "outline"} onClick={() => setExpiringOnly(!expiringOnly)}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {t("inventory.filterExpiring")}
                    </Button>
                  </TooltipTrigger>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="text-center py-8">{t("common.loading")}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("inventory.batchNumber")}</TableHead>
                        <TableHead>{t("products.tradeName")}</TableHead>
                        <TableHead className="text-left">{t("inventory.quantity")}</TableHead>
                        <TableHead className="text-left">{t("inventory.unitCost")}</TableHead>
                        <TableHead className="text-left">{t("inventory.expiryDate")}</TableHead>
                        <TableHead className="text-left">{t("inventory.receivedAt")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchesData?.data?.map((batch: InventoryBatch) => {
                        const isExpiring = batch.expiryDate && new Date(batch.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        const isExpired = batch.expiryDate && new Date(batch.expiryDate) < new Date()
                        return (
                          <TableRow key={batch.id} className={isExpired ? "bg-red-50" : isExpiring ? "bg-orange-50" : ""}>
                            <TableCell className="font-mono">{batch.batchNumber}</TableCell>
                            <TableCell>{batch.product.tradeName}</TableCell>
                            <TableCell className="text-left">{formatNumber(batch.quantity)} {batch.product.unitType}</TableCell>
                            <TableCell className="text-left">{formatCurrency(batch.unitCost)}</TableCell>
                            <TableCell className="text-left">
                              {batch.expiryDate ? (
                                <span className={cn(isExpired ? "text-destructive" : isExpiring ? "text-orange-600" : "")}>
                                  {new Date(batch.expiryDate).toLocaleDateString("ar-EG")}
                                  {isExpired && <Badge variant="destructive" className="ml-2">{t("common.expired")}</Badge>}
                                  {isExpiring && !isExpired && <Badge variant="warning" className="ml-2">{t("inventory.expiringSoon")}</Badge>}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-left">{new Date(batch.receivedAt).toLocaleDateString("ar-EG")}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="movements">
            <CardHeader className="pb-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="text-center py-8">{t("common.loading")}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead>{t("products.tradeName")}</TableHead>
                        <TableHead>{t("inventory.movementType")}</TableHead>
                        <TableHead className="text-left">{t("inventory.quantity")}</TableHead>
                        <TableHead className="text-left">{t("inventory.reference")}</TableHead>
                        <TableHead className="text-left">{t("common.notes")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movementsData?.data?.map((movement: StockMovement) => {
                        const Icon = movementTypeIcons[movement.type] || RotateCcw
                        return (
                          <TableRow key={movement.id}>
                            <TableCell>{new Date(movement.createdAt).toLocaleDateString("ar-EG")}</TableCell>
                            <TableCell>{movement.product.tradeName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1">
                                <Icon className="h-3 w-3" />
                                {movementTypeLabels[movement.type] || movement.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-left">
                              <span className={movement.type === "IN" ? "text-green-600" : movement.type === "OUT" ? "text-red-600" : ""}>
                                {movement.type === "IN" ? "+" : movement.type === "OUT" ? "-" : ""}{formatNumber(movement.quantity)}
                              </span>
                            </TableCell>
                            <TableCell className="text-left text-sm text-muted-foreground">
                              {movement.referenceType} {movement.referenceId?.slice(0, 8)}
                            </TableCell>
                            <TableCell className="text-left text-sm text-muted-foreground max-w-xs truncate">
                              {movement.notes || "—"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

import { cn } from "../../shared/utils/cn"