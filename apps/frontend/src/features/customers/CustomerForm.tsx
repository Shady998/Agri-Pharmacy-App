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
import { Textarea } from "../../shared/components/ui/textarea"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../shared/components/ui/tooltip"
import { CustomerType } from "../../shared/utils/format"

const customerSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  type: z.enum(["FARMER", "PRODUCER", "BOTH"]),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  customer: any | null
  onSubmit: (data: CustomerFormData) => void
  onCancel: () => void
  isLoading: boolean
}

const customerTypes = [
  { value: "FARMER", label: "customers.farmer" },
  { value: "PRODUCER", label: "customers.producer" },
  { value: "BOTH", label: "customers.both" },
]

export function CustomerForm({ customer, onSubmit, onCancel, isLoading }: CustomerFormProps) {
  const { t } = useTranslation()

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      type: "FARMER",
      phone: "",
      address: "",
      notes: "",
      ...customer,
    },
  })

  const handleSubmit = (data: CustomerFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{customer ? t("customers.editCustomer") : t("customers.addCustomer")}</DialogTitle>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="name">{t("customers.name")} *</Label>
        <Input
          id="name"
          placeholder={t("customers.name")}
          {...form.register("name")}
          disabled={isLoading}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Tooltip content={t("tooltips.customerType")}>
          <TooltipTrigger asChild>
            <Label htmlFor="type">{t("customers.type")} *</Label>
          </TooltipTrigger>
        </Tooltip>
        <Select
          value={form.watch("type")}
          onValueChange={form.setValue("type")}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("customers.type")} />
          </SelectTrigger>
          <SelectContent>
            {customerTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {t(type.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t("customers.phone")}</Label>
        <Input
          id="phone"
          type="tel"
          placeholder={t("customers.phone")}
          {...form.register("phone")}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t("customers.address")}</Label>
        <Input
          id="address"
          placeholder={t("customers.address")}
          {...form.register("address")}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("common.notes")}</Label>
        <Textarea
          id="notes"
          placeholder={t("common.notes")}
          rows={3}
          {...form.register("notes")}
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

import { DialogHeader, DialogTitle } from "../../shared/components/ui/dialog"