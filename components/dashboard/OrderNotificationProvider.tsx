'use client'

import { useEffect, useRef, useState, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { BellRing, Volume2, VolumeX } from 'lucide-react'

interface NotificationContextType {
  audioEnabled: boolean
  enableAudio: () => void
  toggleAudio: () => void
}

const NotificationContext = createContext<NotificationContextType>({
  audioEnabled: false,
  enableAudio: () => {},
  toggleAudio: () => {},
})

export const useNotifications = () => useContext(NotificationContext)

/** Play a short "ding" chime using Web Audio API — no file needed */
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const notes = [880, 1100, 1320] // A5, C#6, E6 — a pleasant chord arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.3, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.start(t)
      osc.stop(t + 0.4)
    })
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}

export default function OrderNotificationProvider({
  children,
  tenant
}: {
  children: React.ReactNode
  tenant: { id: string, name: string }
}) {
  const supabase = createClient()
  const [audioEnabled, setAudioEnabled] = useState(false)

  // Load initial state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('order-notifications-audio')
    if (saved === 'true') {
      setAudioEnabled(true)
    }
  }, [])

  // Persist state to localStorage on change
  useEffect(() => {
    localStorage.setItem('order-notifications-audio', audioEnabled.toString())
  }, [audioEnabled])

  // We need a ref so the realtime callback always sees the latest value
  const audioEnabledRef = useRef(false)

  useEffect(() => {
    audioEnabledRef.current = audioEnabled
  }, [audioEnabled])

  useEffect(() => {
    const channel = supabase
      .channel('public:orders:global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` },
        (payload) => {
          const newOrder = payload.new

          if (audioEnabledRef.current) {
            playChime()
          }

          toast.success(
            <div className="flex flex-col gap-1 w-full">
              <span className="font-bold flex items-center gap-2">
                <BellRing size={16} /> Новый заказ!
              </span>
              <span className="text-sm">
                {newOrder.table_number ? `Стол ${newOrder.table_number}` : 'С собой'} · {newOrder.total} UZS  
              </span>
            </div>,
            { duration: 5000 }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant.id, supabase])

  const enableAudio = () => {
    // Unlock Web Audio context with a silent play (user gesture required)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      ctx.resume().then(() => {
        setAudioEnabled(true)
        // Play a test chime so user knows it works
        playChime()
      })
    } catch {
      setAudioEnabled(true)
    }
  }

  const toggleAudio = () => {
    if (audioEnabled) {
      setAudioEnabled(false)
    } else {
      enableAudio()
    }
  }

  return (
    <NotificationContext.Provider value={{ audioEnabled, enableAudio, toggleAudio }}>
      {children}
    </NotificationContext.Provider>
  )
}
