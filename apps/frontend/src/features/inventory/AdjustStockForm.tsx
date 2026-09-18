"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { X } from "lucide-react"
import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import { Label } from "../../shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui/select"
import { DialogFooter } from "../../shared/components/ui/dialog"
import { Textarea } from "../../shared/components/ui/textarea"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../shared/components/ui/tooltip"
import { api } from "../../shared/utils/api"
import { StockMovementType } from "../../shared/utils/format"

const adjustSchema = z.object({
  productId: z.string().min(1, "اختر المنتج"),
  batchId: z.string().optional(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "TRANSFER", "RETURN", "EXPIRED", "DAMAGED"]),
  quantity: z.number().min(0.01, "الكمية يجب أن تكون أكبر من صفر"),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
})

type AdjustFormData = z.infer<typeof adjustSchema>

interface AdjustStockFormProps {
  onSubmit: (data: AdjustFormData) => void
  isLoading: boolean
}

export function AdjustStockForm({ onSubmit, isLoading }: AdjustStockFormProps) {
  const { t } = useTranslation()

  const form = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      productId: "",
      batchId: "",
      type: "ADJUSTMENT",
      quantity: 0,
      referenceType: "",
      referenceId: "",
      notes: "",
    },
  })

  const { data: products } = useQuery({
    queryKey: ["products-for-select"],
    queryFn: () => api.get("/products", { params: { isActive: true, take: 1000 } }).then(res => res.data.data),
  })

  const { data: batches } = useQuery({
    queryKey: ["batches-for-product", form.watch("productId")],
    queryFn: () => api.get("/inventory/batches", { params: { productId: form.watch("productId") } }).then(res => res.data.data),
    enabled: !!form.watch("productId"),
  })

  const handleSubmit = (data: AdjustFormData) => {
    onSubmit(data)
    form.reset({ type: "ADJUSTMENT" })
  }

  const movementTypes = [
    { value: "IN", label: "inventory.movementIn", desc: "استلام مخزون جديد" },
    { value: "OUT", label: "inventory.movementOut", desc: "صرف/بيع مخزون" },
    { value: "ADJUSTMENT", label: "inventory.movementAdjustment", desc: "تعديل يدوي للمخزون" },
    { value: "RETURN", label: "inventory.movementReturn", desc: "مرتجع من عميل" },
    { value: "EXPIRED", label: "inventory.movementExpired", desc: "منتجات منتهية الصلاحية" },
    { value: "DAMAGED", label: "inventory.movementDamaged", desc: "منتجات تالفة" },
  ]

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="productId">{t("products.product")} *</Label>
        <Select
          value={form.watch("productId")}
          onValueChange={(value) => {
            form.setValue("productId", value)
            form.setValue("batchId", "")
          }}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("sales.selectProduct")} />
          </SelectTrigger>
          <SelectContent>
            {products?.map((product: any) => (
              <SelectItem key={product.id} value={product.id}>
                {product.tradeName} - {product.activeIngredient}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.productId && (
          <p className="text-sm text-destructive">{form.formState.errors.productId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="batchId">{t("inventory.batchNumber")}</Label>
        <Select
          value={form.watch("batchId")}
          onValueChange={form.setValue("batchId")}
          disabled={isLoading || !batches?.length}
        >
          <SelectTrigger>
            <SelectValue placeholder={batches?.length ? t("inventory.batchNumber") : "اختر المنتج أولاً"} />
          </SelectTrigger>
          <SelectContent>
            {batches?.map((batch: any) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.batchNumber} - {batch.quantity} {batch.product?.unitType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Tooltip content={t("tooltips.usageNotes")}>
          <TooltipTrigger asChild>
            <Label htmlFor="type">{t("inventory.movementType")} *</Label>
          </TooltipTrigger>
        </Tooltip>
        <Select
          value={form.watch("type")}
          onValueChange={form.setValue("type")}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("inventory.movementType")} />
          </SelectTrigger>
          <SelectContent>
            {movementTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex flex-col">
                  <span>{t(type.label)}</span>
                  <span className="text-xs text-muted-foreground">{t(type.desc)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">{t("inventory.quantity")} *</Label>
        <Input
          id="quantity"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0"
          {...form.register("quantity", { valueAsNumber: true })}
          disabled={isLoading}
        />
        {form.formState.errors.quantity && (
          <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("common.notes")}</Label>
        <Textarea
          id="notes"
          placeholder={t("common.notes")}
          rows={2}
          {...form.register("notes")}
          disabled={isLoading}
        />
      </div>

      <DialogFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => form.reset({ type: "ADJUSTMENT" })} disabled={isLoading}>
          <X className="h-4 w-4 mr-2" />
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.loading") : t("common.save")}
        </Button>
      </DialogFooter>
    </form>
  )
}