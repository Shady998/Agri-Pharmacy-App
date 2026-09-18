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
import { ExpenseCategory } from "../../shared/utils/format"

const expenseSchema = z.object({
  category: z.enum(["RENT", "UTILITIES", "SALARIES", "MARKETING", "TRANSPORT", "MAINTENANCE", "INSURANCE", "TAXES", "OTHER"]),
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  expenseDate: z.string().min(1, "التاريخ مطلوب"),
  description: z.string().optional(),
  receiptUrl: z.string().url().optional().or(z.literal("")),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  expense: any | null
  onSubmit: (data: ExpenseFormData) => void
  onCancel: () => void
  isLoading: boolean
}

const expenseCategories = [
  { value: "RENT", label: "expenses.rent" },
  { value: "UTILITIES", label: "expenses.utilities" },
  { value: "SALARIES", label: "expenses.salaries" },
  { value: "MARKETING", label: "expenses.marketing" },
  { value: "TRANSPORT", label: "expenses.transport" },
  { value: "MAINTENANCE", label: "expenses.maintenance" },
  { value: "INSURANCE", label: "expenses.insurance" },
  { value: "TAXES", label: "expenses.taxes" },
  { value: "OTHER", label: "expenses.other" },
]

export function ExpenseForm({ expense, onSubmit, onCancel, isLoading }: ExpenseFormProps) {
  const { t } = useTranslation()

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "OTHER",
      amount: 0,
      expenseDate: new Date().toISOString().split("T")[0],
      description: "",
      receiptUrl: "",
      ...expense,
    },
  })

  const handleSubmit = (data: ExpenseFormData) => {
    onSubmit({
      ...data,
      receiptUrl: data.receiptUrl || undefined,
    })
    form.reset()
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{expense ? t("expenses.editExpense") : t("expenses.addExpense")}</DialogTitle>
      </DialogHeader>

      <div className="space-y-2">
        <Tooltip content={t("tooltips.expenseCategory")}>
          <TooltipTrigger asChild>
            <Label htmlFor="category">{t("expenses.category")} *</Label>
          </TooltipTrigger>
        </Tooltip>
        <Select
          value={form.watch("category")}
          onValueChange={form.setValue("category")}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("expenses.category")} />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {t(cat.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">{t("expenses.amount")} *</Label>
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
          <Label htmlFor="expenseDate">{t("expenses.expenseDate")} *</Label>
          <Input
            id="expenseDate"
            type="date"
            {...form.register("expenseDate")}
            disabled={isLoading}
          />
          {form.formState.errors.expenseDate && (
            <p className="text-sm text-destructive">{form.formState.errors.expenseDate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("expenses.description")}</Label>
        <Input
          id="description"
          placeholder={t("expenses.description")}
          {...form.register("description")}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="receiptUrl">{t("expenses.receipt")}</Label>
        <Input
          id="receiptUrl"
          type="url"
          placeholder="https://example.com/receipt.jpg"
          {...form.register("receiptUrl")}
          disabled={isLoading}
        />
        {form.formState.errors.receiptUrl && (
          <p className="text-sm text-destructive">{form.formState.errors.receiptUrl.message}</p>
        )}
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