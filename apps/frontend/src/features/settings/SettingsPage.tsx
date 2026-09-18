"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Save, Bell, AlertTriangle, Calendar, Globe, Monitor, User, Shield } from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "../../shared/components/ui/card"
import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import { Label } from "../../shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui/select"
import { Switch } from "../../shared/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../shared/components/ui/tabs"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../shared/components/ui/tooltip"
import { Badge } from "../../shared/components/ui/badge"
import { api } from "../../shared/utils/api"
import { toast } from "react-hot-toast"

interface TenantSettings {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  settings: Record<string, any>
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ["tenant-settings"],
    queryFn: () => api.get("/settings").then(res => res.data),
  })

  const { data: units } = useQuery({
    queryKey: ["settings-units"],
    queryFn: () => api.get("/settings/units").then(res => res.data),
  })

  const { data: categories } = useQuery({
    queryKey: ["settings-categories"],
    queryFn: () => api.get("/settings/categories").then(res => res.data),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch("/settings", data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] })
      toast.success(t("settings.saveSuccess"))
      setSaving(false)
    },
    onError: () => {
      toast.error(t("common.error"))
      setSaving(false)
    },
  })

  const handleSave = (data: any) => {
    setSaving(true)
    updateMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("navigation.settings")}</h1>
          <p className="text-muted-foreground">{t("settings.title")}</p>
        </div>
        <Button onClick={() => handleSave(settings?.settings || {})} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? t("common.loading") : t("common.save")}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general"><User className="h-4 w-4 mr-2" />{t("settings.general")}</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" />{t("settings.notifications")}</TabsTrigger>
          <TabsTrigger value="appearance"><Monitor className="h-4 w-4 mr-2" />{t("settings.theme")}</TabsTrigger>
          <TabsTrigger value="units"><Shield className="h-4 w-4 mr-2" />{t("settings.units")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.tenantInfo")}</CardTitle>
              <CardDescription>{t("settings.general")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("settings.name")} *</Label>
                  <Input id="name" value={settings?.name || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">{t("settings.slug")} *</Label>
                  <Input id="slug" value={settings?.slug || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">{t("settings.plan")}</Label>
                  <Select value={settings?.plan || "STARTER"} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STARTER">{t("common.starter")}</SelectItem>
                      <SelectItem value="PROFESSIONAL">{t("common.professional")}</SelectItem>
                      <SelectItem value="ENTERPRISE">{t("common.enterprise")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{t("settings.status")}</Label>
                  <Select value={settings?.status || "ACTIVE"} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">{t("common.active")}</SelectItem>
                      <SelectItem value="TRIAL">{t("common.trial")}</SelectItem>
                      <SelectItem value="SUSPENDED">{t("common.suspended")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customSettings">{t("settings.customSettings")}</Label>
                <Textarea
                  id="customSettings"
                  value={JSON.stringify(settings?.settings || {}, null, 2)}
                  onChange={e => {
                    try {
                      handleSave({ ...settings, settings: JSON.parse(e.target.value) })
                    } catch {}
                  }}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.notifications")}</CardTitle>
              <CardDescription>{t("settings.notifications")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("settings.lowStockAlerts")}</Label>
                  <p className="text-sm text-muted-foreground">{t("tooltips.lowStockAlert")}</p>
                </div>
                <Switch checked={settings?.settings?.lowStockAlerts !== false} onCheckedChange={checked => handleSave({ ...settings, settings: { ...settings?.settings, lowStockAlerts: checked } })} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("settings.expiryAlerts")}</Label>
                  <p className="text-sm text-muted-foreground">{t("tooltips.expiryAlert")}</p>
                </div>
                <Switch checked={settings?.settings?.expiryAlerts !== false} onCheckedChange={checked => handleSave({ ...settings, settings: { ...settings?.settings, expiryAlerts: checked } })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.theme")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("settings.language")}</Label>
                <Select value={i18n.language} onValueChange={lng => i18n.changeLanguage(lng)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">{t("settings.arabic")}</SelectItem>
                    <SelectItem value="en">{t("settings.english")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.theme")}</Label>
                <Select value="system" disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t("settings.light")}</SelectItem>
                    <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                    <SelectItem value="system">{t("settings.system")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.units")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t("settings.units.weight")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {units?.weight?.map((unit: string) => (
                      <Badge key={unit} variant="outline">{unit}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.units.volume")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {units?.volume?.map((unit: string) => (
                      <Badge key={unit} variant="outline">{unit}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.units.count")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {units?.count?.map((unit: string) => (
                      <Badge key={unit} variant="outline">{unit}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.categories.pesticideTypes")}</Label>
                <div className="flex flex-wrap gap-2">
                  {categories?.pesticideTypes?.map((cat: string) => (
                    <Badge key={cat} variant="outline">{t(`products.${cat.toLowerCase()}`)}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.categories.expenseCategories")}</Label>
                <div className="flex flex-wrap gap-2">
                  {categories?.expenseCategories?.map((cat: string) => (
                    <Badge key={cat} variant="outline">{t(`expenses.${cat.toLowerCase()}`)}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("settings.categories.customerTypes")}</Label>
                <div className="flex flex-wrap gap-2">
                  {categories?.customerTypes?.map((cat: string) => (
                    <Badge key={cat} variant="outline">{t(`customers.${cat.toLowerCase()}`)}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { Textarea } from "../../shared/components/ui/textarea"
import { Switch } from "../../shared/components/ui/switch"