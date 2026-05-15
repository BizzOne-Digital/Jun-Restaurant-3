import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// Public layout — wraps all customer-facing pages with Header + Footer.
// Admin pages use their own layout (src/app/admin/layout.tsx) and are excluded.

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1" id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}
