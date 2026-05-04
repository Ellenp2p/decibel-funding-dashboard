const BASE_URLS = {
  mainnet: 'https://api.mainnet.aptoslabs.com/decibel',
  testnet: 'https://api.testnet.aptoslabs.com/decibel',
}

const CORS_PROXY = 'https://corsproxy.io/?'
const CONFIG_KEY = 'decibel_direct_config'
const REFRESH_KEY = 'funding_refresh_interval'

export interface DirectConfig {
  apiKey: string
  network: 'mainnet' | 'testnet'
  account?: string
}

export function getRefreshInterval(): number {
  const raw = localStorage.getItem(REFRESH_KEY)
  const val = raw ? parseInt(raw, 10) : 30
  return isNaN(val) || val < 5 ? 30 : val
}

export function setRefreshInterval(seconds: number): void {
  localStorage.setItem(REFRESH_KEY, String(seconds))
}

export function getConfig(): DirectConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DirectConfig
  } catch {
    return null
  }
}

export function setConfig(config: DirectConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function isConfigured(): boolean {
  const c = getConfig()
  return !!c && !!c.apiKey
}

async function fetchDecibelDirect(path: string, config: DirectConfig): Promise<any> {
  const baseUrl = BASE_URLS[config.network] || BASE_URLS.mainnet
  const url = `${baseUrl}${path}`

  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Origin: 'https://app.decibel.trade',
      },
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return resp.json()
  } catch (e: any) {
    if (e.name === 'TypeError' || e.message?.includes('Failed to fetch')) {
      return fetchViaProxy(url, config.apiKey)
    }
    throw e
  }
}

async function fetchViaProxy(url: string, apiKey: string): Promise<any> {
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`
  const resp = await fetch(proxyUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

export const api = {
  getMarkets: async (): Promise<any[]> => {
    const config = getConfig()
    if (!config) throw new Error('Not configured')
    const data = await fetchDecibelDirect('/api/v1/markets', config)
    return Array.isArray(data) ? data : data?.items || data?.value || []
  },

  getPrices: async (): Promise<any[]> => {
    const config = getConfig()
    if (!config) throw new Error('Not configured')
    const data = await fetchDecibelDirect('/api/v1/prices', config)
    return Array.isArray(data) ? data : data?.items || data?.value || []
  },
}
