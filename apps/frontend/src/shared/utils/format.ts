export function formatNumber(num: number | string, locale = "ar-EG"): string {
  const n = typeof num === "string" ? parseFloat(num) : num
  if (isNaN(n)) return "0"
  return new Intl.NumberFormat(locale).format(n)
}

export function formatCurrency(amount: number | string, currency = "SAR", locale = "ar-EG"): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount
  if (isNaN(n)) return "0.00"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatDate(date: string | Date, locale = "ar-EG"): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d)
}

export function formatDateTime(date: string | Date, locale = "ar-EG"): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatRelativeTime(date: string | Date, locale = "ar-EG"): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffDays > 7) return formatDate(d, locale)
  if (diffDays > 0) return `${diffDays} ${diffDays === 1 ? "يوم" : "أيام"} مضت`
  if (diffHours > 0) return `${diffHours} ${diffHours === 1 ? "ساعة" : "ساعات"} مضت`
  if (diffMinutes > 0) return `${diffMinutes} ${diffMinutes === 1 ? "دقيقة" : "دقائق"} مضت`
  return "الآن"
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Type exports for enums
export type PesticideType = "FUNGICIDE" | "INSECTICIDE" | "HERBICIDE" | "OTHER"
export type UnitType = "KG" | "BOX" | "SEEDS" | "LITER" | "PACKET"
export type CustomerType = "FARMER" | "PRODUCER" | "BOTH"
export type DebtStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED"
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHECK" | "CARD" | "OTHER"
export type SaleStatus = "DRAFT" | "COMPLETED" | "RETURNED" | "CANCELLED"
export type ExpenseCategory = "RENT" | "UTILITIES" | "SALARIES" | "MARKETING" | "TRANSPORT" | "MAINTENANCE" | "INSURANCE" | "TAXES" | "OTHER"
export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT" | "TRANSFER" | "RETURN" | "EXPIRED" | "DAMAGED"
export type UserRole = "SUPER_ADMIN" | "TENANT_ADMIN" | "MANAGER" | "SALESPERSON" | "VIEWER"
export type TenantStatus = "ACTIVE" | "INACTIVE" | "TRIAL" | "SUSPENDED"
export type SubscriptionPlan = "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | "CUSTOM"