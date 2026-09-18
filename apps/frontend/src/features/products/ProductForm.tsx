"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import { Textarea } from "../../shared/components/ui/textarea"
import { Label } from "../../shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../shared/components/ui/dialog"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../shared/components/ui/tooltip"
import { cn } from "../../shared/utils/cn"
import { PesticideType, UnitType } from "../../shared/utils/format"

const productSchema = z.object({
  tradeName: z.string().min(1, "الاسم التجاري مطلوب"),
  activeIngredient: z.string().min(1, "المادة الفعالة مطلوبة"),
  pesticideType: z.enum(["FUNGICIDE", "INSECTICIDE", "HERBICIDE", "OTHER"]),
  usageNotes: z.string().optional(),
  unitType: z.enum(["KG", "BOX", "SEEDS", "LITER", "PACKET"]).default("KG"),
  minThreshold: z.number().min(0).default(0),
  barcode: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product: any | null
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
  isLoading: boolean
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

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const { t } = useTranslation()

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      tradeName: "",
      activeIngredient: "",
      pesticideType: "FUNGICIDE",
      usageNotes: "",
      unitType: "KG",
      minThreshold: 0,
      barcode: "",
      ...product,
    },
  })

  useEffect(() => {
    if (product) {
      form.reset({
        tradeName: product.tradeName || "",
        activeIngredient: product.activeIngredient || "",
        pesticideType: product.pesticideType || "FUNGICIDE",
        usageNotes: product.usageNotes || "",
        unitType: product.unitType || "KG",
        minThreshold: product.minThreshold || 0,
        barcode: product.barcode || "",
      })
    } else {
      form.reset({
        tradeName: "",
        activeIngredient: "",
        pesticideType: "FUNGICIDE",
        usageNotes: "",
        unitType: "KG",
        minThreshold: 0,
        barcode: "",
      })
    }
  }, [product, form])

  const handleSubmit = (data: ProductFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{product ? t("products.editProduct") : t("products.addProduct")}</DialogTitle>
      </DialogHeader>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Tooltip content={t("tooltips.tradeName")}>
            <TooltipTrigger asChild>
              <Label htmlFor="tradeName">{t("products.tradeName")} *</Label>
            </TooltipTrigger>
          </Tooltip>
          <Input
            id="tradeName"
            placeholder={t("products.tradeName")}
            {...form.register("tradeName")}
            disabled={isLoading}
          />
          {form.formState.errors.tradeName && (
            <p className="text-sm text-destructive">{form.formState.errors.tradeName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Tooltip content={t("tooltips.activeIngredient")}>
            <TooltipTrigger asChild>
              <Label htmlFor="activeIngredient">{t("products.activeIngredient")} *</Label>
            </TooltipTrigger>
          </Tooltip>
          <Input
            id="activeIngredient"
            placeholder={t("products.activeIngredient")}
            {...form.register("activeIngredient")}
            disabled={isLoading}
          />
          {form.formState.errors.activeIngredient && (
            <p className="text-sm text-destructive">{form.formState.errors.activeIngredient.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Tooltip content={t("tooltips.pesticideType")}>
            <TooltipTrigger asChild>
              <Label htmlFor="pesticideType">{t("products.pesticideType")} *</Label>
            </TooltipTrigger>
          </Tooltip>
          <Select
            value={form.watch("pesticideType")}
            onValueChange={form.setValue("pesticideType")}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("products.pesticideType")} />
            </SelectTrigger>
            <SelectContent>
              {pesticideTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {t(type.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Tooltip content={t("tooltips.unitType")}>
            <TooltipTrigger asChild>
              <Label htmlFor="unitType">{t("products.unitType")} *</Label>
            </TooltipTrigger>
          </Tooltip>
          <Select
            value={form.watch("unitType")}
            onValueChange={form.setValue("unitType")}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("products.unitType")} />
            </SelectTrigger>
            <SelectContent>
              {unitTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Tooltip content={t("tooltips.minThreshold")}>
            <TooltipTrigger asChild>
              <Label htmlFor="minThreshold">{t("products.minThreshold")}</Label>
            </TooltipTrigger>
          </Tooltip>
          <Input
            id="minThreshold"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            {...form.register("minThreshold", { valueAsNumber: true })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="barcode">{t("products.barcode")}</Label>
          <Input
            id="barcode"
            placeholder={t("products.barcode")}
            {...form.register("barcode")}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Tooltip content={t("tooltips.usageNotes")}>
          <TooltipTrigger asChild>
            <Label htmlFor="usageNotes">{t("products.usageNotes")}</Label>
          </TooltipTrigger>
        </Tooltip>
        <Textarea
          id="usageNotes"
          placeholder={t("products.usageNotes")}
          rows={3}
          {...form.register("usageNotes")}
          disabled={isLoading}
        />
      </div>

      <DialogFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
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