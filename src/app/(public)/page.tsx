import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/HeroSection'
import { MenuSection } from '@/components/menu/MenuSection'
import { getMenuGrouped } from '@/services/menuService'

export const metadata: Metadata = {
  title: 'Mascot Chinese Cuisine — Order Online',
  description:
    'Authentic Northeastern Chinese cuisine in Mascot, NSW. Order noodles, seafood, rice bowls, soups, and classic dishes for pickup or delivery.',
}

// No cache — discounts and popular status change in real-time
export const revalidate = 0

export default async function HomePage() {
  let initialData = undefined

  try {
    initialData = await getMenuGrouped()
  } catch {
    // If DB is unavailable, fall back to client-side fetch in MenuSection
    initialData = undefined
  }

  return (
    <>
      <HeroSection />
      <MenuSection initialData={initialData} />
    </>
  )
}
