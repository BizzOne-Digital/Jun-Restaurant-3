import type { Metadata } from 'next'
import { MenuSection } from '@/components/menu/MenuSection'
import { getMenuGrouped } from '@/services/menuService'

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'Browse our full menu of authentic Northeastern Chinese dishes. Noodles, seafood, rice bowls, soups, and more.',
}

export const revalidate = 0

export default async function MenuPage() {
  let initialData = undefined

  try {
    initialData = await getMenuGrouped()
  } catch {
    initialData = undefined
  }

  return (
    <div className="min-h-screen bg-restaurant-bg">
      <div className="bg-gradient-to-r from-red-950 to-red-800 text-white py-12">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
            Our Menu
          </h1>
          <p className="text-red-200">
            Authentic Northeastern Chinese cuisine, freshly prepared daily.
          </p>
        </div>
      </div>
      <MenuSection initialData={initialData} />
    </div>
  )
}
