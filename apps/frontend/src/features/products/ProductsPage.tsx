"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Filter, Edit, Trash2, AlertTriangle, Package } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card"
import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/components/ui/table"
import { Badge } from "../../shared/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../shared/components/ui/dialog"
import { Label } from "../../shared/components/ui/label"
import { Textarea } from "../../shared/components/ui/textarea"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../shared/components/ui/tooltip"
import { api } from "../../shared/utils/api"
import { formatCurrency, formatNumber, PesticideType, UnitType } from "../../shared/utils/format"
import { ProductForm } from "./ProductForm"
import { toast } from "react-hot-toast"

interface Product {
  id: string
  tradeName: string
  activeIngredient: string
  pesticideType: PesticideType
  usageNotes: string | null
  unitType: UnitType
  minThreshold: number
  barcode: string | null
  isActive: boolean
  totalStock: number
  isLowStock: boolean
  inventoryBatches: any[]
}

const pesticideTypes = [
  { value: "FUNGICIDE", label: "products.fungicide" },
  { value: "INSECTICIDE", label: "products.insecticide" },
  { value: "HERBICIDE", label: "products.herbicide" },
  { value: "OTHER", label: "products.other" },
]

const unitTypes = [
  { value: "KG", label: "KG" },
  { value: "BOX", label: "BOX" },
  { value: "SEEDS", label: "SEEDS" },
  { value: "LITER", label: "LITER" },
  { value: "PACKET", label: "PACKET" },
]

export default function ProductsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [pesticideType, setPesticideType] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, pesticideType, showInactive, lowStockOnly],
    queryFn: () => api.get("/products", {
      params: { search, pesticideType, isActive: showInactive ? undefined : true, lowStock: lowStockOnly },
    }).then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/products", data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(t("products.productCreated"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/products/${id}`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(t("products.productUpdated"))
      setEditingProduct(null)
    },
    onError: () => toast.error(t("common.error")),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success(t("products.productDeleted"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const handleDelete = (id: string) => {
    if (confirm(t("products.deleteConfirm"))) {
      deleteMutation.mutate(id)
    }
  }

  const pesticideTypeLabels: Record<string, string> = {
    FUNGICIDE: t("products.fungicide"),
    INSECTICIDE: t("products.insecticide"),
    HERBICIDE: t("products.herbicide"),
    OTHER: t("products.other"),
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("navigation.products")}</h1>
          <p className="text-muted-foreground">{t("products.title")}</p>
        </div>
        <Dialog open={!!editingProduct} onOpenChange={open => !open && setEditingProduct(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("products.addProduct")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? t("products.editProduct") : t("products.addProduct")}</DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              onSubmit={editingProduct ? (data) => updateMutation.mutate({ id: editingProduct.id, data }) : createMutation.mutate}
              onCancel={() => setEditingProduct(null)}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("products.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Tooltip content={t("tooltips.pesticideType")}>
                <TooltipTrigger asChild>
                  <Select value={pesticideType} onValueChange={setPesticideType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("products.filterByType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("products.allTypes")}</SelectItem>
                      {pesticideTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
              </Tooltip>
              <Tooltip content={t("tooltips.lowStockAlert")}>
                <TooltipTrigger asChild>
                  <Button
                    variant={lowStockOnly ? "default" : "outline"}
                    onClick={() => setLowStockOnly(!lowStockOnly)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {t("products.lowStockAlert")}
                  </Button>
                </TooltipTrigger>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t("common.loading")}</div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={showInactive ? "default" : "outline"} onClick={() => setShowInactive(!showInactive)} className="cursor-pointer">
                  {showInactive ? t("common.inactive") : t("common.active")}
                </Badge>
                <Badge variant={lowStockOnly ? "destructive" : "outline"} className="cursor-pointer">
                  {t("products.lowStockAlert")} ({data?.data?.filter((p: Product) => p.isLowStock).length || 0})
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("products.tradeName")}</TableHead>
                      <TableHead>{t("products.activeIngredient")}</TableHead>
                      <TableHead>{t("products.pesticideType")}</TableHead>
                      <TableHead className="text-left">{t("products.unitType")}</TableHead>
                      <TableHead className="text-left">{t("products.minThreshold")}</TableHead>
                      <TableHead className="text-left">{t("inventory.totalQuantity")}</TableHead>
                      <TableHead className="text-left">{t("products.stockStatus")}</TableHead>
                      <TableHead className="text-left">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data?.map((product: Product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.tradeName}</TableCell>
                        <TableCell>{product.activeIngredient}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {pesticideTypeLabels[product.pesticideType] || product.pesticideType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">{product.unitType}</TableCell>
                        <TableCell className="text-left">{formatNumber(product.minThreshold)}</TableCell>
                        <TableCell className="text-left font-medium">
                          {formatNumber(product.totalStock)}
                          {product.inventoryBatches.length > 1 && (
                            <span className="text-muted-foreground ml-2 text-sm">
                              ({product.inventoryBatches.length} {t("products.batches")})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-left">
                          {product.isLowStock ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {t("products.outOfStock")}
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              <Package className="h-3 w-3 mr-1" />
                              {t("products.inStock")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex items-center gap-2">
                            <Tooltip content={t("common.edit")}>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                            </Tooltip>
                            <Tooltip content={t("common.delete")}>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data && data.total > data.data.length && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("common.page")} {data.page} {t("common.of")} {Math.ceil(data.total / data.limit)}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={data.page === 1} onClick={() => {}}>
                      {t("common.previous")}
                    </Button>
                    <Button variant="outline" size="sm" disabled={data.page >= Math.ceil(data.total / data.limit)} onClick={() => {}}>
                      {t("common.next")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}