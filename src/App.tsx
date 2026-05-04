import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { setLanguage } from '@/i18n'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api, getConfig, isConfigured, getRefreshInterval } from '@/api/client'
import { cn, formatPrice, pnlClass } from '@/lib/utils'
import { SettingsModal } from '@/components/SettingsModal'
import { useFundingCountdown } from '@/hooks/use-countdown'
import { Settings, Globe, Search, RefreshCw, Timer, Activity, Github } from 'lucide-react'

interface FundingItem {
  market: string
  symbol: string
  fundingRate: number
  isFundingPositive: boolean
  markPx: number
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'high'>('all')
  const [sortKey, setSortKey] = useState<'rate' | 'annual' | 'name'>('rate')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const countdown = useFundingCountdown()

  useEffect(() => {
    if (!isConfigured()) {
      setSettingsOpen(true)
    }
  }, [])

  const refreshIntervalMs = getRefreshInterval() * 1000

  const { data: pricesData, isLoading: pricesLoading, error: pricesError, refetch } = useQuery({
    queryKey: ['prices', refreshIntervalMs],
    queryFn: () => api.getPrices(),
    enabled: isConfigured(),
    staleTime: 10_000,
    refetchInterval: refreshIntervalMs,
    retry: 1,
  })

  const { data: marketsData, isLoading: marketsLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: () => api.getMarkets(),
    enabled: isConfigured(),
    staleTime: 300_000,
    refetchInterval: false,
    retry: 1,
  })

  const marketMap = useMemo(() => {
    const markets = Array.isArray(marketsData) ? marketsData : (marketsData as any)?.value || []
    const map: Record<string, any> = {}
    for (const m of markets) {
      if (m.mode !== 'Open') continue
      const addr = (m.market_addr || m.address || '').toLowerCase()
      if (addr) map[addr] = m
    }
    return map
  }, [marketsData])

  const fundingRates = useMemo((): FundingItem[] => {
    const pricesList = Array.isArray(pricesData) ? pricesData : (pricesData as any)?.value || []
    return pricesList
      .map((p: any) => {
        const marketAddr = (p.market || '').toLowerCase()
        const matched = marketMap[marketAddr]
        if (!matched) return null
        return {
          market: p.market,
          symbol: matched.market_name || matched.name || p.market?.slice(0, 10) + '...',
          fundingRate: p.funding_rate_bps || 0,
          isFundingPositive: p.is_funding_positive || false,
          markPx: p.mark_px || p.oracle_px || 0,
        }
      })
      .filter(Boolean) as FundingItem[]
  }, [pricesData, marketMap])

  const filtered = useMemo(() => {
    let list = [...fundingRates]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((f) => f.symbol.toLowerCase().includes(q))
    }
    if (tab === 'high') {
      list = list.filter((f) => Math.abs(f.fundingRate) >= 10)
    }
    const sortFns: Record<string, (a: FundingItem, b: FundingItem) => number> = {
      rate: (a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate),
      annual: (a, b) => Math.abs(b.fundingRate) * 24 * 365 - Math.abs(a.fundingRate) * 24 * 365,
      name: (a, b) => a.symbol.localeCompare(b.symbol),
    }
    list.sort(sortFns[sortKey] || sortFns.rate)
    return list
  }, [fundingRates, search, tab, sortKey])

  const isLoading = pricesLoading || marketsLoading
  const hasError = !!pricesError
  const lastUpdated = new Date().toLocaleTimeString(i18n.language === 'zh' ? 'zh-CN' : 'en-US')

  const stats = useMemo(() => {
    const total = fundingRates.length
    const highCount = fundingRates.filter((f) => Math.abs(f.fundingRate) >= 10).length
    const positiveCount = fundingRates.filter((f) => f.isFundingPositive).length
    const negativeCount = total - positiveCount
    return { total, highCount, positiveCount, negativeCount }
  }, [fundingRates])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight md:text-lg">{t('fundingMonitor.title')}</h1>
              <p className="text-[11px] text-muted-foreground">{t('fundingMonitor.desc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Countdown */}
            {isConfigured() && (
              <div
                className="mr-1 flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5"
                title={t('fundingMonitor.nextFunding')}
              >
                <Timer className={cn('h-3.5 w-3.5 text-primary', countdown.totalSeconds <= 60 && 'animate-pulse')} />
                <span className={cn('text-xs font-mono font-bold tabular-nums text-primary', countdown.totalSeconds <= 60 && 'text-red-400')}>
                  {countdown.text}
                </span>
              </div>
            )}
            <a
              href="https://github.com/Ellenp2p/decibel-funding-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <button
              onClick={() => setLanguage(i18n.language === 'zh' ? 'en' : 'zh')}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{i18n.language === 'zh' ? 'EN' : '中文'}</span>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('config.title')}</span>
            </button>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder={t('fundingMonitor.searchMarket')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl border-border/60 bg-card pl-10 text-sm placeholder:text-muted-foreground/40"
            />
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card p-1">
            <FilterBtn active={tab === 'all'} onClick={() => setTab('all')}>
              {t('fundingMonitor.allMarkets')}
            </FilterBtn>
            <FilterBtn active={tab === 'high'} onClick={() => setTab('high')}>
              {t('fundingMonitor.highRates')}
            </FilterBtn>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card p-1">
            <SortBtn active={sortKey === 'rate'} onClick={() => setSortKey('rate')}>
              {t('fundingMonitor.rateSortDesc')}
            </SortBtn>
            <SortBtn active={sortKey === 'annual'} onClick={() => setSortKey('annual')}>
              {t('fundingMonitor.annualSortDesc')}
            </SortBtn>
            <SortBtn active={sortKey === 'name'} onClick={() => setSortKey('name')}>
              {t('fundingMonitor.nameSortAsc')}
            </SortBtn>
          </div>

          <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/60">
            {t('common.lastUpdated')}: {lastUpdated}
          </span>
        </div>

        {/* Error */}
        {hasError && (
          <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-sm text-destructive">{t('common.error')}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Content */}
        {!isLoading && !hasError && (
          <>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-3">
              {filtered.length === 0 ? (
                <EmptyState t={t} />
              ) : (
                filtered.map((f) => <MobileCard key={f.market} item={f} t={t} />)
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="overflow-hidden border-border/60">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60 hover:bg-transparent">
                        <TableHead className="pl-6">{t('fundingMonitor.market')}</TableHead>
                        <TableHead>{t('fundingMonitor.rate')}</TableHead>
                        <TableHead>{t('fundingMonitor.direction')}</TableHead>
                        <TableHead>{t('fundingMonitor.annualized')}</TableHead>
                        <TableHead className="pr-6">{t('fundingMonitor.markPrice')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                            {t('common.noResults')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((f) => (
                          <TableRow key={f.market} className="border-border/40 transition-colors">
                            <TableCell className="pl-6 font-semibold">{f.symbol}</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  'font-bold tabular-nums',
                                  f.isFundingPositive ? 'text-green-400' : 'text-red-400'
                                )}
                              >
                                {f.isFundingPositive ? '+' : '-'}
                                {(Math.abs(f.fundingRate) / 100).toFixed(4)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={f.isFundingPositive ? 'success' : 'destructive'}
                                className="font-medium"
                              >
                                {f.isFundingPositive ? t('fundingMonitor.longsPay') : t('fundingMonitor.shortsPay')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={f.isFundingPositive ? 'text-green-400' : 'text-red-400'}>
                                {f.isFundingPositive ? '+' : '-'}
                                {(Math.abs(f.fundingRate) * 24 * 365 / 100).toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="pr-6 tabular-nums text-muted-foreground">
                              {formatPrice(f.markPx)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="mt-5 text-center text-[11px] text-muted-foreground/40">
              {filtered.length} / {fundingRates.length} {t('fundingMonitor.allMarkets').toLowerCase()}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

function SortBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-secondary text-secondary-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

function MobileCard({ item, t }: { item: FundingItem; t: (key: string) => string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{item.symbol}</span>
        <Badge variant={item.isFundingPositive ? 'success' : 'destructive'} className="text-[10px]">
          {item.isFundingPositive ? t('fundingMonitor.longsPay') : t('fundingMonitor.shortsPay')}
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{t('fundingMonitor.rate')}</div>
          <div className={cn('mt-0.5 font-bold tabular-nums', item.isFundingPositive ? 'text-green-400' : 'text-red-400')}>
            {item.isFundingPositive ? '+' : '-'}
            {(Math.abs(item.fundingRate) / 100).toFixed(4)}%
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{t('fundingMonitor.annualized')}</div>
          <div className={cn('mt-0.5 font-bold tabular-nums', item.isFundingPositive ? 'text-green-400' : 'text-red-400')}>
            {item.isFundingPositive ? '+' : '-'}
            {(Math.abs(item.fundingRate) * 24 * 365 / 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{t('fundingMonitor.markPrice')}</div>
          <div className="mt-0.5 tabular-nums text-muted-foreground">{formatPrice(item.markPx)}</div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40">
        <Search className="h-5 w-5 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
    </div>
  )
}
