import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number, decimals = 2): string {
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(decimals)
}

export function formatUSD(num: number): string {
  return `$${formatNumber(Math.abs(num))}`
}

export function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

export function formatPrice(num: number): string {
  if (num >= 1000) {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return '$' + num.toFixed(4)
}

export function pnlClass(value: number): string {
  if (value > 0) return 'text-green-400'
  if (value < 0) return 'text-red-400'
  return 'text-gray-400'
}
