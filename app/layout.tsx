import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'QRCulinary — QR-меню для ресторанов',
    template: '%s | QRCulinary',
  },
  description: 'Создайте цифровое QR-меню для вашего ресторана за 5 минут. Без приложений, без регистрации для гостей.',
  keywords: ['QR меню', 'цифровое меню', 'ресторан', 'кафе', 'QR код'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
