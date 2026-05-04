import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getConfig, setConfig, getRefreshInterval, setRefreshInterval, type DirectConfig } from '@/api/client'
import { X, Key, Globe, User, Clock } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { t } = useTranslation()
  const [configForm, setConfigForm] = useState<DirectConfig>({
    apiKey: '',
    network: 'mainnet',
    account: '',
  })
  const [refreshInterval, setRefreshIntervalState] = useState(30)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) {
      const c = getConfig()
      if (c) setConfigForm(c)
      setRefreshIntervalState(getRefreshInterval())
      setSaved(false)
    }
  }, [open])

  const handleSave = () => {
    if (!configForm.apiKey.trim()) return
    setConfig({ ...configForm, apiKey: configForm.apiKey.trim() })
    setRefreshInterval(refreshInterval)
    setSaved(true)
    setTimeout(() => {
      onClose()
      window.location.reload()
    }, 600)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold">{t('config.title')}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          {/* API Key */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4 text-primary" />
              {t('config.apiKey')}
            </label>
            <Input
              type="password"
              placeholder={t('config.apiKeyPlaceholder')}
              value={configForm.apiKey}
              onChange={(e) => setConfigForm((p) => ({ ...p, apiKey: e.target.value }))}
              className="h-11"
            />
          </div>

          {/* Network */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-primary" />
              {t('config.network')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfigForm((p) => ({ ...p, network: 'mainnet' }))}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                  configForm.network === 'mainnet'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-transparent text-muted-foreground hover:border-muted-foreground/50'
                }`}
              >
                {t('config.mainnet')}
              </button>
              <button
                onClick={() => setConfigForm((p) => ({ ...p, network: 'testnet' }))}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                  configForm.network === 'testnet'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-transparent text-muted-foreground hover:border-muted-foreground/50'
                }`}
              >
                {t('config.testnet')}
              </button>
            </div>
          </div>

          {/* Account */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-primary" />
              {t('config.account')}
            </label>
            <Input
              placeholder={t('config.accountPlaceholder')}
              value={configForm.account || ''}
              onChange={(e) => setConfigForm((p) => ({ ...p, account: e.target.value }))}
              className="h-11"
            />
          </div>

          {/* Refresh Interval */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-primary" />
              {t('config.refreshInterval')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 30, 60].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setRefreshIntervalState(sec)}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                    refreshInterval === sec
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-transparent text-muted-foreground hover:border-muted-foreground/50'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={!configForm.apiKey.trim()}
            className="h-11 w-full text-base font-semibold"
          >
            {saved ? t('config.saved') : t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
