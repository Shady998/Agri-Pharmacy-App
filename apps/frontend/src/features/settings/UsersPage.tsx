"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Edit, UserX, UserCheck, Mail, Shield, User } from "lucide-react"
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
import { formatDate, UserRole } from "../../shared/utils/format"
import { toast } from "react-hot-toast"

interface UserData {
  id: string
  clerkId: string
  name: string | null
  email: string
  phone: string | null
  role: UserRole
  isActive: boolean
  avatarUrl: string | null
  lastLoginAt: string | null
  createdAt: string
}

const roles = [
  { value: "TENANT_ADMIN", label: "users.tenantAdmin" },
  { value: "MANAGER", label: "users.manager" },
  { value: "SALESPERSON", label: "users.salesperson" },
  { value: "VIEWER", label: "users.viewer" },
]

const roleColors: Record<string, "default" | "destructive" | "warning" | "success" | "info"> = {
  TENANT_ADMIN: "destructive",
  MANAGER: "warning",
  SALESPERSON: "info",
  VIEWER: "default",
}

export default function UsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [editingUser, setEditingUser] = useState<UserData | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["users", search, roleFilter],
    queryFn: () => api.get("/users", { params: { search, role: roleFilter } }).then(res => res.data),
  })

  const inviteMutation = useMutation({
    mutationFn: (data: any) => api.post("/users/invite", data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success(t("users.inviteSent"))
    },
    onError: (error: any) => toast.error(error.response?.data?.message || t("common.error")),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => api.patch(`/users/${id}/role`, { role }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success(t("users.roleUpdated"))
    },
    onError: (error: any) => toast.error(error.response?.data?.message || t("common.error")),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/deactivate`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success(t("users.userDeactivated"))
    },
    onError: (error: any) => toast.error(error.response?.data?.message || t("common.error")),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/activate`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success(t("users.userActivated"))
    },
    onError: (error: any) => toast.error(error.response?.data?.message || t("common.error")),
  })

  const handleRoleChange = (id: string, role: UserRole) => {
    updateRoleMutation.mutate({ id, role })
  }

  const handleDeactivate = (id: string) => {
    if (confirm(t("users.cannotDeactivateSelf").replace("لا يمكنك", "هل أنت متأكد من"))) {
      deactivateMutation.mutate(id)
    }
  }

  const handleActivate = (id: string) => {
    activateMutation.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("navigation.users")}</h1>
          <p className="text-muted-foreground">{t("users.title")}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("users.inviteUser")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("users.inviteUser")}</DialogTitle>
            </DialogHeader>
            <InviteUserForm onSubmit={inviteMutation.mutate} isLoading={inviteMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("users.role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("common.all")}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <Badge variant={roleColors[role.value]} className="mr-2">{t(role.label)}</Badge>
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
                    <TableHead>{t("users.name")}</TableHead>
                    <TableHead>{t("users.email")}</TableHead>
                    <TableHead>{t("users.role")}</TableHead>
                    <TableHead>{t("users.isActive")}</TableHead>
                    <TableHead>{t("users.lastLogin")}</TableHead>
                    <TableHead className="text-left">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((user: UserData) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{user.name || user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleColors[user.role]}>{t(`users.${user.role.toLowerCase()}`)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "success" : "default"}>
                          {user.isActive ? t("common.active") : t("common.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}</TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-2">
                          <Tooltip content={t("common.edit")}>
                            <TooltipTrigger asChild>
                              <Select value={user.role} onValueChange={role => handleRoleChange(user.id, role)} disabled={user.role === "SUPER_ADMIN"}>
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                      <Badge variant={roleColors[role.value]} className="mr-2">{t(role.label)}</Badge>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TooltipTrigger>
                          </Tooltip>
                          {user.isActive ? (
                            <Tooltip content={t("users.deactivate")}>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeactivate(user.id)}>
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                            </Tooltip>
                          ) : (
                            <Tooltip content={t("users.activate")}>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-600" onClick={() => handleActivate(user.id)}>
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                            </Tooltip>
                          )}
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

function InviteUserForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("VIEWER")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ email, name, role })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("users.email")} *</Label>
        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("users.email")} disabled={isLoading} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">{t("users.name")} *</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder={t("users.name")} disabled={isLoading} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">{t("users.role")} *</Label>
        <Select value={role} onValueChange={setRole} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                <Badge variant="outline" className="mr-2">{t(r.label)}</Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => {}} disabled={isLoading}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.loading") : t("common.save")}
        </Button>
      </DialogFooter>
    </form>
  )
}