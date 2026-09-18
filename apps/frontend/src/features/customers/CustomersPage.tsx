"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Edit, Trash2, Users, CreditCard, ArrowUpDown } from "lucide-react"
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
import { api } from "../../shared/utils/api"
import { formatCurrency, formatNumber, CustomerType } from "../../shared/utils/format"
import { CustomerForm } from "./CustomerForm"
import { toast } from "react-hot-toast"

interface Customer {
  id: string
  name: string
  type: CustomerType
  phone: string | null
  address: string | null
  notes: string | null
  totalDebt: number
  paidAmount: number
  pendingDebts: number
}

const customerTypes = [
  { value: "FARMER", label: "customers.farmer" },
  { value: "PRODUCER", label: "customers.producer" },
  { value: "BOTH", label: "customers.both" },
]

export default function CustomersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search, typeFilter, sortBy, sortOrder],
    queryFn: () => api.get("/customers", {
      params: { search, type: typeFilter, sortBy, sortOrder },
    }).then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/customers", data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success(t("customers.customerCreated"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/customers/${id}`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success(t("customers.customerUpdated"))
      setEditingCustomer(null)
    },
    onError: () => toast.error(t("common.error")),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      toast.success(t("customers.customerDeleted"))
    },
    onError: (error: any) => toast.error(error.response?.data?.message || t("common.error")),
  })

  const handleDelete = (id: string) => {
    if (confirm(t("customers.deleteConfirm"))) {
      deleteMutation.mutate(id)
    }
  }

  const typeLabels: Record<string, string> = {
    FARMER: t("customers.farmer"),
    PRODUCER: t("customers.producer"),
    BOTH: t("customers.both"),
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("navigation.customers")}</h1>
          <p className="text-muted-foreground">{t("customers.title")}</p>
        </div>
        <Dialog open={!!editingCustomer} onOpenChange={open => !open && setEditingCustomer(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCustomer(null)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("customers.addCustomer")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? t("customers.editCustomer") : t("customers.addCustomer")}</DialogTitle>
            </DialogHeader>
            <CustomerForm
              customer={editingCustomer}
              onSubmit={editingCustomer ? (data) => updateMutation.mutate({ id: editingCustomer.id, data }) : createMutation.mutate}
              onCancel={() => setEditingCustomer(null)}
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
              <Input placeholder={t("customers.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("customers.type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("common.all")}</SelectItem>
                  {customerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{t(type.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("customers.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t("customers.sortByName")}</SelectItem>
                  <SelectItem value="totalDebt">{t("customers.sortByDebt")}</SelectItem>
                  <SelectItem value="createdAt">{t("common.date")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                <ArrowUpDown className={cn("h-4 w-4", sortOrder === "desc" && "rotate-180")} />
              </Button>
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
                    <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                      {t("customers.name")} <ArrowUpDown className="h-4 w-4 inline" />
                    </TableHead>
                    <TableHead>{t("customers.type")}</TableHead>
                    <TableHead>{t("customers.phone")}</TableHead>
                    <TableHead className="text-left">{t("customers.totalDebt")}</TableHead>
                    <TableHead className="text-left">{t("customers.paidAmount")}</TableHead>
                    <TableHead className="text-left">{t("customers.remainingDebt")}</TableHead>
                    <TableHead className="text-left">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((customer: Customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[customer.type] || customer.type}</Badge>
                      </TableCell>
                      <TableCell>{customer.phone || "—"}</TableCell>
                      <TableCell className="text-left font-medium text-destructive">{formatCurrency(customer.totalDebt)}</TableCell>
                      <TableCell className="text-left font-medium text-green-600">{formatCurrency(customer.paidAmount)}</TableCell>
                      <TableCell className="text-left font-medium">{formatCurrency(customer.totalDebt - customer.paidAmount)}</TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-2">
                          <Tooltip content={t("common.edit")}>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setEditingCustomer(customer)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                          </Tooltip>
                          <Tooltip content={t("common.delete")}>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(customer.id)}>
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
    </div>
  )
}

import { cn } from "../../shared/utils/cn"