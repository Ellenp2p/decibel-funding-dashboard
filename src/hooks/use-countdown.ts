import { useEffect, useState } from 'react'

interface Countdown {
  minutes: number
  seconds: number
  totalSeconds: number
  text: string
}

/**
 * 计算到下一个资金费率收取时间的倒计时
 * Decibel 资金费率每小时收取一次，在整点时刻
 */
export function useFundingCountdown(): Countdown {
  const [countdown, setCountdown] = useState<Countdown>(() => calculateCountdown())

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return countdown
}

function calculateCountdown(): Countdown {
  const now = new Date()
  const nextHour = new Date(now)
  nextHour.setHours(now.getHours() + 1, 0, 0, 0)

  const diff = nextHour.getTime() - now.getTime()
  const totalSeconds = Math.max(0, Math.floor(diff / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return {
    minutes,
    seconds,
    totalSeconds,
    text: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  }
}
