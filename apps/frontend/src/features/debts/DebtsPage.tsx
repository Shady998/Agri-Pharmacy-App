"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Edit, CreditCard, Banknote, ArrowUpDown, Clock, Coins } from "lucide-react"
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
import { formatCurrency, formatNumber, DebtStatus, PaymentMethod } from "../../shared/utils/format"
import { DebtForm } from "./DebtForm"
import { PaymentForm } from "./PaymentForm"
import { toast } from "react-hot-toast"

interface Debt {
  id: string
  amount: number
  status: DebtStatus
  dueDate: string | null
  notes: string | null
  createdAt: string
  customer: { id: string; name: string; phone: string | null }
  payments: { id: string; amount: number; method: PaymentMethod; paidAt: string; notes: string | null }[]
  paidAmount: number
  remaining: number
}

const debtStatuses = [
  { value: "PENDING", label: "debts.pending" },
  { value: "PARTIAL", label: "debts.partial" },
  { value: "PAID", label: "debts.paid" },
  { value: "OVERDUE", label: "debts.overdue" },
  { value: "CANCELLED", label: "debts.cancelled" },
]

const statusColors: Record<string, "default" | "destructive" | "warning" | "success" | "info"> = {
  PENDING: "warning",
  PARTIAL: "info",
  PAID: "success",
  OVERDUE: "destructive",
  CANCELLED: "default",
}

export default function DebtsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [activeTab, setActiveTab] = useState("list")
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["debts", search, statusFilter],
    queryFn: () => api.get("/debts", { params: { search, status: statusFilter } }).then(res => res.data),
  })

  const { data: agingData } = useQuery({
    queryKey: ["debts-aging"],
    queryFn: () => api.get("/debts/aging").then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/debts", data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["debts-aging"] })
      toast.success(t("debts.debtCreated"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.post(`/debts/${id}/payments`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["debts-aging"] })
      toast.success(t("debts.paymentRecorded"))
      setSelectedDebt(null)
    },
    onError: (error: any) => toast.error(error.response?.data?.message || t("common.error")),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("navigation.debts")}</h1>
          <p className="text-muted-foreground">{t("debts.title")}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("debts.addDebt")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("debts.addDebt")}</DialogTitle>
            </DialogHeader>
            <DebtForm onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">{t("debts.title")}</TabsTrigger>
          <TabsTrigger value="aging">{t("debts.agingReport")}</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("debts.filterByStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("common.all")}</SelectItem>
                    {debtStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <Badge variant={statusColors[status.value]} className="mr-2">{t(status.label)}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                        <TableHead>{t("customers.name")}</TableHead>
                        <TableHead>{t("debts.amount")}</TableHead>
                        <TableHead className="text-left">{t("debts.paidAmount")}</TableHead>
                        <TableHead className="text-left">{t("customers.remainingDebt")}</TableHead>
                        <TableHead>{t("debts.status")}</TableHead>
                        <TableHead>{t("debts.dueDate")}</TableHead>
                        <TableHead className="text-left">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.data?.map((debt: Debt) => (
                        <TableRow key={debt.id}>
                          <TableCell className="font-medium">{debt.customer.name}</TableCell>
                          <TableCell>{formatCurrency(debt.amount)}</TableCell>
                          <TableCell className="text-left text-green-600">{formatCurrency(debt.paidAmount)}</TableCell>
                          <TableCell className="text-left font-medium text-destructive">{formatCurrency(debt.remaining)}</TableCell>
                          <TableCell>
                            <Badge variant={statusColors[debt.status]}>{t(`debts.${debt.status.toLowerCase()}`)}</Badge>
                          </TableCell>
                          <TableCell>{debt.dueDate ? new Date(debt.dueDate).toLocaleDateString("ar-EG") : "—"}</TableCell>
                          <TableCell className="text-left">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedDebt(debt)}>
                              <Coins className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="aging">
          <Card>
            <CardHeader>
              <CardTitle>{t("debts.agingReport")}</CardTitle>
            </CardHeader>
            <CardContent>
              {agingData ? (
                <div className="grid gap-4 md:grid-cols-5">
                  {[
                    { key: "current", label: t("debts.current"), color: "success" },
                    { key: "1-30", label: t("debts.days1_30"), color: "warning" },
                    { key: "31-60", label: t("debts.days31_60"), color: "destructive" },
                    { key: "61-90", label: t("debts.days61_90"), color: "destructive" },
                    { key: "90+", label: t("debts.days90plus"), color: "destructive" },
                  ].map(({ key, label, color }) => (
                    <Card key={key} className="text-center">
                      <CardContent className="py-6">
                        <div className="text-3xl font-bold text-{color}-600">{formatCurrency(agingData[key]?.amount || 0)}</div>
                        <div className="text-sm text-muted-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground">{agingData[key]?.count || 0} {t("common.count")}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">{t("common.loading")}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedDebt && (
        <Dialog open onOpenChange={open => !open && setSelectedDebt(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("debts.recordPayment")} - {selectedDebt.customer.name}</DialogTitle>
            </DialogHeader>
            <PaymentForm
              debt={selectedDebt}
              onSubmit={(data) => paymentMutation.mutate({ id: selectedDebt.id, data })}
              isLoading={paymentMutation.isPending}
              onClose={() => setSelectedDebt(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

import { cn } from "../../shared/utils/cn"