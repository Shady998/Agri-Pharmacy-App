"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Plus, Minus, Trash2, Search, Package, UserPlus, CreditCard, Banknote, Coins } from "lucide-react"
import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import { Label } from "../../shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/components/ui/table"
import { Badge } from "../../shared/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../../shared/components/ui/dialog"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../shared/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card"
import { api } from "../../shared/utils/api"
import { formatCurrency, formatNumber } from "../../shared/utils/format"
import { toast } from "react-hot-toast"

interface SaleItem {
  id: string
  productId: string
  productName: string
  batchId: string | null
  batchNumber: string | null
  quantity: number
  unitPrice: number
  total: number
}

interface SaleFormProps {
  onSubmit: (data: any) => void
  isLoading: boolean
}

export function SaleForm({ onSubmit, isLoading }: SaleFormProps) {
  const { t } = useTranslation()
  const [items, setItems] = useState<SaleItem[]>([])
  const [customerId, setCustomerId] = useState("")
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [notes, setNotes] = useState("")
  const [searchProduct, setSearchProduct] = useState("")
  const [showProductSearch, setShowProductSearch] = useState(false)

  const { data: products } = useQuery({
    queryKey: ["products-for-pos", searchProduct],
    queryFn: () => api.get("/products/search", { params: { q: searchProduct } }).then(res => res.data),
    enabled: searchProduct.length >= 2,
  })

  const { data: customers } = useQuery({
    queryKey: ["customers-for-pos"],
    queryFn: () => api.get("/customers", { params: { take: 100 } }).then(res => res.data.data),
  })

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = discount
  const taxAmount = (subtotal - discountAmount) * (tax / 100)
  const grandTotal = subtotal - discountAmount + taxAmount

  const addItem = (product: any) => {
    const existingIndex = items.findIndex(i => i.productId === product.id)
    if (existingIndex >= 0) {
      const newItems = [...items]
      newItems[existingIndex].quantity += 1
      newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unitPrice
      setItems(newItems)
    } else {
      const newItem: SaleItem = {
        id: `temp_${Date.now()}`,
        productId: product.id,
        productName: product.tradeName,
        batchId: null,
        batchNumber: null,
        quantity: 1,
        unitPrice: 0,
        total: 0,
      }
      setItems([...items, newItem])
    }
    setSearchProduct("")
    setShowProductSearch(false)
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems(items.map(item =>
      item.id === id ? { ...item, quantity, total: quantity * item.unitPrice } : item
    ))
  }

  const updatePrice = (id: string, price: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, unitPrice: price, total: item.quantity * price } : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error("أضف صنفاً واحداً على الأقل")
      return
    }
    onSubmit({
      customerId: customerId || undefined,
      items: items.map(item => ({
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      discount: discountAmount,
      tax: taxAmount,
      notes,
    })
    setItems([])
    setCustomerId("")
    setDiscount(0)
    setTax(0)
    setNotes("")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("sales.items")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("sales.selectProduct")}
                value={searchProduct}
                onChange={e => { setSearchProduct(e.target.value); setShowProductSearch(true) }}
                className="pl-10"
                onFocus={() => setShowProductSearch(true)}
              />
            </div>

            {showProductSearch && products && products.length > 0 && (
              <div className="absolute z-10 w-full max-h-60 overflow-y-auto bg-popover border rounded-md shadow-lg mb-4">
                {products.map((product: any) => (
                  <button
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="w-full text-right px-4 py-2 hover:bg-accent flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    <span>{product.tradeName} - {product.activeIngredient}</span>
                  </button>
                ))}
              </div>
            )}

            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("sales.noItems")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("products.tradeName")}</TableHead>
                    <TableHead className="text-left">{t("inventory.quantity")}</TableHead>
                    <TableHead className="text-left">{t("sales.unitPrice")}</TableHead>
                    <TableHead className="text-left">{t("sales.total")}</TableHead>
                    <TableHead className="text-left">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-20 text-center"
                          />
                          <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell className="text-left font-medium">{formatCurrency(item.total)}</TableCell>
                      <TableCell className="text-left">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("sales.customer")}</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("sales.selectCustomer")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("sales.walkIn")}</SelectItem>
                    {customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone || "بدون هاتف"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("common.notes")}</Label>
                <Input placeholder={t("common.notes")} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("sales.summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t("sales.subtotal")}</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("sales.discount")}</span>
                <Input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="0.01"
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-32 ml-2"
                />
              </div>
              <div className="flex justify-between">
                <span>{t("sales.tax")} (%)</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={tax}
                  onChange={e => setTax(parseFloat(e.target.value) || 0)}
                  className="w-32 ml-2"
                />
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-lg font-bold">{t("sales.grandTotal")}</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Button onClick={handleSubmit} disabled={items.length === 0 || isLoading} className="h-12 text-lg">
                <Coins className="h-5 w-5 mr-2" />
                {t("sales.completeSale")} - {formatCurrency(grandTotal)}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline"><CreditCard className="h-4 w-4 mr-2" />{t("debts.card")}</Button>
                <Button variant="outline"><Banknote className="h-4 w-4 mr-2" />{t("debts.cash")}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}