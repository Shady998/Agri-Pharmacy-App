"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import { Label } from "../../shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui/select"
import { DialogFooter } from "../../shared/components/ui/dialog"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../shared/components/ui/tooltip"
import { api } from "../../shared/utils/api"
import { toast } from "react-hot-toast"

const receiveSchema = z.object({
  productId: z.string().min(1, "اختر المنتج"),
  batchNumber: z.string().min(1, "رقم الدفعة مطلوب"),
  quantity: z.number().min(0.01, "الكمية يجب أن تكون أكبر من صفر"),
  unitCost: z.number().min(0, "التكلفة لا يمكن أن تكون سالبة"),
  expiryDate: z.string().optional(),
})

type ReceiveFormData = z.infer<typeof receiveSchema>

interface ReceiveStockFormProps {
  onSubmit: (data: ReceiveFormData) => void
  isLoading: boolean
}

export function ReceiveStockForm({ onSubmit, isLoading }: ReceiveStockFormProps) {
  const { t } = useTranslation()

  const form = useForm<ReceiveFormData>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      productId: "",
      batchNumber: "",
      quantity: 0,
      unitCost: 0,
      expiryDate: "",
    },
  })

  const { data: products } = useQuery({
    queryKey: ["products-for-select"],
    queryFn: () => api.get("/products", { params: { isActive: true, take: 1000 } }).then(res => res.data.data),
  })

  const handleSubmit = (data: ReceiveFormData) => {
    onSubmit({
      ...data,
      expiryDate: data.expiryDate || undefined,
    })
    form.reset()
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="productId">{t("products.product")} *</Label>
        <Select
          value={form.watch("productId")}
          onValueChange={form.setValue("productId")}
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
        <Tooltip content={t("tooltips.batchNumber")}>
          <TooltipTrigger asChild>
            <Label htmlFor="batchNumber">{t("inventory.batchNumber")} *</Label>
          </TooltipTrigger>
        </Tooltip>
        <Input
          id="batchNumber"
          placeholder={t("inventory.batchNumber")}
          {...form.register("batchNumber")}
          disabled={isLoading}
        />
        {form.formState.errors.batchNumber && (
          <p className="text-sm text-destructive">{form.formState.errors.batchNumber.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="unitCost">{t("inventory.unitCost")} *</Label>
          <Input
            id="unitCost"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            {...form.register("unitCost", { valueAsNumber: true })}
            disabled={isLoading}
          />
          {form.formState.errors.unitCost && (
            <p className="text-sm text-destructive">{form.formState.errors.unitCost.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiryDate">{t("inventory.expiryDate")}</Label>
        <Input
          id="expiryDate"
          type="date"
          {...form.register("expiryDate")}
          disabled={isLoading}
        />
      </div>

      <DialogFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isLoading}>
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

import { useQuery } from "@tanstack/react-query"