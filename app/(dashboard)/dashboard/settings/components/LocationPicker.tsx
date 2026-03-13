'use client'

import { useEffect, useRef } from 'react'

interface Props {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}

// Default: Tashkent city center
const DEFAULT_LAT = 41.2995
const DEFAULT_LNG = 69.2401

export function LocationPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false

    // Dynamic import to avoid SSR issues with Leaflet
    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return

      // Fix default icon paths (Leaflet + webpack/Next.js quirk)
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const initLat = lat ?? DEFAULT_LAT
      const initLng = lng ?? DEFAULT_LNG

      const map = L.map(containerRef.current!, {
        center: [initLat, initLng],
        zoom: lat ? 16 : 12,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map)
      marker.bindPopup('Перетащите маркер на точное место').openPopup()

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onChange(pos.lat, pos.lng)
      })

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng)
        onChange(e.latlng.lat, e.latlng.lng)
      })

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync marker if lat/lng change externally (e.g. on load)
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      markerRef.current.setLatLng([lat, lng])
      mapRef.current?.setView([lat, lng], mapRef.current.getZoom())
    }
  }, [lat, lng])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Кликните на карте или перетащите маркер, чтобы указать точное расположение
        </span>
        {lat && lng && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        )}
      </div>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        style={{ height: 320, borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}
      />
    </div>
  )
}
