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
import { CustomerType } from "../../shared/utils/format"

const debtSchema = z.object({
  customerId: z.string().min(1, "اختر العميل"),
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

type DebtFormData = z.infer<typeof debtSchema>

interface DebtFormProps {
  onSubmit: (data: DebtFormData) => void
  isLoading: boolean
}

export function DebtForm({ onSubmit, isLoading }: DebtFormProps) {
  const { t } = useTranslation()

  const form = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      customerId: "",
      amount: 0,
      dueDate: "",
      notes: "",
    },
  })

  const { data: customers } = useQuery({
    queryKey: ["customers-for-select"],
    queryFn: () => api.get("/customers", { params: { take: 1000 } }).then(res => res.data.data),
  })

  const handleSubmit = (data: DebtFormData) => {
    onSubmit({
      ...data,
      dueDate: data.dueDate || undefined,
    })
    form.reset()
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customerId">{t("debts.customer")} *</Label>
        <Select
          value={form.watch("customerId")}
          onValueChange={form.setValue("customerId")}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("debts.customer")} />
          </SelectTrigger>
          <SelectContent>
            {customers?.map((customer: any) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone || "بدون هاتف"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.customerId && (
          <p className="text-sm text-destructive">{form.formState.errors.customerId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">{t("debts.amount")} *</Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0"
          {...form.register("amount", { valueAsNumber: true })}
          disabled={isLoading}
        />
        {form.formState.errors.amount && (
          <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Tooltip content={t("tooltips.dueDate")}>
          <TooltipTrigger asChild>
            <Label htmlFor="dueDate">{t("debts.dueDate")}</Label>
          </TooltipTrigger>
        </Tooltip>
        <Input
          id="dueDate"
          type="date"
          {...form.register("dueDate")}
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