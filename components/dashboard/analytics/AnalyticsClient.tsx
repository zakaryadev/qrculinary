"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DateRangePicker, DateRange } from "./DateRangePicker"
import { StatCards } from "./StatCards"
import { ScansChart } from "./ScansChart"
import { TopItemsTable } from "./TopItemsTable"
import { Loader2, Download } from "lucide-react"

export default function AnalyticsClient({ tenantId }: { tenantId: string }) {
  const [range, setRange] = useState<DateRange>('week')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [range])

  async function fetchData() {
    setLoading(true)
    
    let startDate = new Date()
    const endDate = new Date().toISOString()

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0)
    } else if (range === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (range === 'month') {
      startDate.setMonth(startDate.getMonth() - 1)
    } else {
      startDate = new Date(2026, 0, 1) // Beginning of time
    }

    const startIso = startDate.toISOString()

    try {
      const [scansRes, topItemsRes, conversionRes] = await Promise.all([
        (supabase as any).rpc('get_qr_scans_stats', { p_tenant_id: tenantId, p_start_date: startIso, p_end_date: endDate }),
        (supabase as any).rpc('get_top_items_stats', { p_tenant_id: tenantId, p_start_date: startIso, p_end_date: endDate, p_limit: 10 }),
        (supabase as any).rpc('get_conversion_stats', { p_tenant_id: tenantId, p_start_date: startIso, p_end_date: endDate }),
      ])

      setData({
        scans: scansRes.data ?? [],
        topItems: topItemsRes.data ?? [],
        conversion: conversionRes.data?.[0] ?? { menu_views: 0, total_orders: 0, conversion_rate: 0 }
      })
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    if (!data) return
    
    const headers = ["Дата", "Всего сканирований", "Уникальных гостей"]
    const rows = data.scans.map((s: any) => [s.scan_date, s.total_scans, s.unique_scans])
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map((r: any) => r.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `analytics_scans_${range}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-brand" size={32} />
        <p className="text-text-secondary text-sm">Загрузка данных...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <DateRangePicker value={range} onChange={setRange} />
        
        <button 
          onClick={exportCsv}
          className="btn-ghost text-xs py-2 px-3 h-10"
        >
          <Download size={14} />
          Экспорт CSV
        </button>
      </div>

      <StatCards 
        menuViews={Number(data?.conversion?.menu_views ?? 0)}
        totalOrders={Number(data?.conversion?.total_orders ?? 0)}
        conversionRate={Number(data?.conversion?.conversion_rate ?? 0)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScansChart data={data?.scans ?? []} />
        <TopItemsTable items={data?.topItems ?? []} />
      </div>
    </div>
  )
}
