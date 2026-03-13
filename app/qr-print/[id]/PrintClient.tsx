'use client'

import { useEffect, useState } from 'react'
import { generateQRDataURL } from '@/lib/qr/generate'
import { QRCode, Tenant } from '@/lib/types'

export default function PrintClient({ qrCode, tenant }: { qrCode: QRCode, tenant: Tenant }) {
  const [qrSrc, setQrSrc] = useState('')

  useEffect(() => {
    generateQRDataURL(qrCode.url).then(src => {
      setQrSrc(src)
      // Wait for image to render before printing
      setTimeout(() => {
        window.print()
      }, 500)
    })
  }, [qrCode.url])

  return (
    <div className="w-full min-h-screen bg-white text-black flex items-center justify-center p-8 print:p-0">
      <div className="max-w-md w-full border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center flex flex-col items-center print:border-none print:shadow-none">
        {tenant.logo_url && (
          <img src={tenant.logo_url} alt="Logo" className="w-24 h-24 object-contain mb-6 print:mb-4" />
        )}
        <h1 className="text-4xl font-black mb-2 tracking-tight" style={{ color: tenant.primary_color || '#3ECF8E' }}>
          {tenant.name}
        </h1>
        <p className="text-gray-500 mb-8 text-lg print:mb-6">Отсканируйте код для просмотра меню</p>
        
        {qrSrc ? (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 w-64 h-64 print:shadow-none print:border-none print:w-72 print:h-72">
             <img src={qrSrc} alt="QR Code" className="w-full h-full" />
          </div>
        ) : (
          <div className="w-64 h-64 bg-gray-100 animate-pulse rounded-2xl mb-6"></div>
        )}
        
        <h2 className="text-3xl font-bold bg-gray-50 px-6 py-2 rounded-xl print:bg-transparent">
          {qrCode.label}
        </h2>
        {qrCode.table_number && (
          <p className="mt-2 text-xl font-medium text-gray-500">
            Стол: {qrCode.table_number}
          </p>
        )}
        
        <div className="mt-12 text-gray-400 text-sm flex flex-col items-center gap-1">
          <p>Powered by QRCulinary</p>
        </div>
      </div>
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}} />
    </div>
  )
}
