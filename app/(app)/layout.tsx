import BottomNav from '@/app/components/BottomNav'
import FloatingOrderButton from '@/app/components/FloatingOrderButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {children}
      <FloatingOrderButton />
      <BottomNav />
    </div>
  )
}
