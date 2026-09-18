"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Edit, Trash2, Calendar, Receipt, DollarSign } from "lucide-react"
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
import { formatCurrency, formatNumber, formatDate, ExpenseCategory } from "../../shared/utils/format"
import { ExpenseForm } from "./ExpenseForm"
import { toast } from "react-hot-toast"

interface Expense {
  id: string
  category: ExpenseCategory
  amount: number
  expenseDate: string
  description: string | null
  receiptUrl: string | null
  createdAt: string
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

export default function ExpensesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [activeTab, setActiveTab] = useState("list")

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", search, categoryFilter, startDate, endDate],
    queryFn: () => api.get("/expenses", { params: { search, category: categoryFilter, startDate, endDate } }).then(res => res.data),
  })

  const { data: summaryData } = useQuery({
    queryKey: ["expenses-summary", startDate, endDate],
    queryFn: () => api.get("/expenses/summary", { params: { startDate: startDate || new Date(new Date().getFullYear(), 0, 1).toISOString(), endDate: endDate || new Date().toISOString() } }).then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/expenses", data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] })
      toast.success(t("expenses.expenseCreated"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/expenses/${id}`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] })
      toast.success(t("expenses.expenseUpdated"))
      setEditingExpense(null)
    },
    onError: () => toast.error(t("common.error")),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] })
      toast.success(t("expenses.expenseDeleted"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("navigation.expenses")}</h1>
          <p className="text-muted-foreground">{t("expenses.title")}</p>
        </div>
        <Dialog open={!!editingExpense} onOpenChange={open => !open && setEditingExpense(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingExpense(null)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("expenses.addExpense")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? t("expenses.editExpense") : t("expenses.addExpense")}</DialogTitle>
            </DialogHeader>
            <ExpenseForm
              expense={editingExpense}
              onSubmit={editingExpense ? (data) => updateMutation.mutate({ id: editingExpense.id, data }) : createMutation.mutate}
              onCancel={() => setEditingExpense(null)}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {summaryData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("expenses.totalExpenses")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{formatCurrency(summaryData.total || 0)}</div>
              <DollarSign className="h-5 w-5 text-destructive" />
            </CardContent>
          </Card>
          {summaryData.byCategory?.slice(0, 3).map((cat: any) => (
            <Card key={cat.category}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t(`expenses.${cat.category.toLowerCase()}`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(cat.total)}</div>
                <div className="text-sm text-muted-foreground">{cat.count} {t("common.count")}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">{t("expenses.title")}</TabsTrigger>
          <TabsTrigger value="summary">{t("expenses.summary")}</TabsTrigger>
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
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("expenses.category")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("common.all")}</SelectItem>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{t(cat.label)}</SelectItem>
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
                        <TableHead>{t("expenses.category")}</TableHead>
                        <TableHead className="text-left">{t("expenses.amount")}</TableHead>
                        <TableHead>{t("expenses.description")}</TableHead>
                        <TableHead>{t("expenses.receipt")}</TableHead>
                        <TableHead className="text-left">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.data?.map((expense: Expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{t(`expenses.${expense.category.toLowerCase()}`)}</Badge>
                          </TableCell>
                          <TableCell className="text-left font-medium text-destructive">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell className="max-w-xs truncate">{expense.description || "—"}</TableCell>
                          <TableCell>
                            {expense.receiptUrl ? (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                                  <Receipt className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex items-center gap-2">
                              <Tooltip content={t("common.edit")}>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => setEditingExpense(expense)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                              </Tooltip>
                              <Tooltip content={t("common.delete")}>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(expense.id)}>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <div className="flex gap-2">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder={t("reports.startDate")} className="w-[160px]" />
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder={t("reports.endDate")} className="w-[160px]" />
              </div>
            </CardHeader>
            <CardContent>
              {summaryData && summaryData.byCategory ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("expenses.category")}</TableHead>
                      <TableHead className="text-left">{t("expenses.amount")}</TableHead>
                      <TableHead className="text-left">{t("expenses.count")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryData.byCategory.map((cat: any) => (
                      <TableRow key={cat.category}>
                        <TableCell>{t(`expenses.${cat.category.toLowerCase()}`)}</TableCell>
                        <TableCell className="text-left font-medium text-destructive">{formatCurrency(cat.total)}</TableCell>
                        <TableCell className="text-left">{cat.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">{t("common.loading")}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}