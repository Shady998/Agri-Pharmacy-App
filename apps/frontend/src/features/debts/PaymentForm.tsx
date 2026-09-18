"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { X, CreditCard, Banknote, Building2 } from "lucide-react"
import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import { Label } from "../../shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui/select"
import { DialogFooter } from "../../shared/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card"
import { Badge } from "../../shared/components/ui/badge"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../shared/components/ui/tooltip"
import { formatCurrency, PaymentMethod } from "../../shared/utils/format"

const paymentSchema = z.object({
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "CARD", "OTHER"]),
  notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  debt: any
  onSubmit: (data: PaymentFormData) => void
  onClose: () => void
  isLoading: boolean
}

const paymentMethods = [
  { value: "CASH", label: "debts.cash", icon: Banknote },
  { value: "BANK_TRANSFER", label: "debts.bankTransfer", icon: Building2 },
  { value: "CHECK", label: "debts.check", icon: CreditCard },
  { value: "CARD", label: "debts.card", icon: CreditCard },
  { value: "OTHER", label: "common.other", icon: CreditCard },
]

export function PaymentForm({ debt, onSubmit, onClose, isLoading }: PaymentFormProps) {
  const { t } = useTranslation()

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: debt.remaining,
      method: "CASH",
      notes: "",
    },
  })

  const handleSubmit = (data: PaymentFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("debts.debtDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("debts.amount")}</span>
              <div className="font-bold text-lg">{formatCurrency(debt.amount)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">{t("debts.paidAmount")}</span>
              <div className="font-bold text-lg text-green-600">{formatCurrency(debt.paidAmount)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">{t("customers.remainingDebt")}</span>
              <div className="font-bold text-lg text-destructive">{formatCurrency(debt.remaining)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">{t("debts.status")}</span>
              <Badge variant="outline">{t(`debts.${debt.status.toLowerCase()}`)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="amount">{t("debts.amount")} *</Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          max={debt.remaining}
          step="0.01"
          placeholder="0"
          {...form.register("amount", { valueAsNumber: true })}
          disabled={isLoading}
        />
        {form.formState.errors.amount && (
          <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
        )}
        <p className="text-xs text-muted-foreground">{t("debts.remaining")}: {formatCurrency(debt.remaining)}</p>
      </div>

      <div className="space-y-2">
        <Tooltip content={t("tooltips.paymentMethod")}>
          <TooltipTrigger asChild>
            <Label htmlFor="method">{t("debts.paymentMethod")} *</Label>
          </TooltipTrigger>
        </Tooltip>
        <Select
          value={form.watch("method")}
          onValueChange={form.setValue("method")}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("debts.paymentMethod")} />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <SelectItem key={method.value} value={method.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {t(method.label)}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
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
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
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