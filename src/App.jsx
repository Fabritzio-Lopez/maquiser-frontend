import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import DashboardView from './components/DashboardView'
import SalesView from './components/SalesView'
import ProductionKanbanView from './components/ProductionKanbanView'
import Catalog from './components/Catalog'
import Uniform3DViewer from './components/Uniform3DViewer'
import InventoryView from './components/InventoryView'
import PartnersView from './components/PartnersView'
import QuotationModal from './components/QuotationModal'
import { Sparkles } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'sales' | 'production' | 'catalog' | 'customizer' | 'inventory' | 'partners'
  const [cartItems, setCartItems] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState(false)

  // URL del backend (Local o Render)
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  // Probar estado de conexión con FastAPI y Supabase
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_URL}/`)
        if (res.ok) setBackendStatus(true)
        else setBackendStatus(false)
      } catch {
        setBackendStatus(false)
      }
    }
    checkBackend()
    const interval = setInterval(checkBackend, 15000)
    return () => clearInterval(interval)
  }, [API_URL])

  const handleAddToCart = (product) => {
    setCartItems(prev => [...prev, { ...product, quantity: 1 }])
    setIsModalOpen(true)
  }

  const handleAddCustomToCart = (customItem) => {
    setCartItems(prev => [...prev, customItem])
    setIsModalOpen(true)
  }

  const handleRemoveItem = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearCart = () => {
    setCartItems([])
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Barra de Navegación del ERP */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        cartCount={cartItems.length}
        onOpenCart={() => setIsModalOpen(true)}
      />

      {/* Contenido Principal Dinámico */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView apiUrl={API_URL} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'sales' && (
          <SalesView apiUrl={API_URL} />
        )}

        {activeTab === 'production' && (
          <ProductionKanbanView apiUrl={API_URL} />
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Inventario de Confección
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Catálogo de Prendas Terminadas</h2>
              <p className="text-xs text-slate-500 mt-1">
                Prendas en inventario conectadas mediante API REST a la base de datos PostgreSQL en Supabase.
              </p>
            </div>
            <Catalog apiUrl={API_URL} onAddToCart={handleAddToCart} />
          </div>
        )}

        {activeTab === 'customizer' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                Modelado Tridimensional en Tiempo Real
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Personalizador 3D de Prendas (GLB / Three.js)</h2>
              <p className="text-xs text-slate-500 mt-1">
                Visualiza modelos 3D reales con caída orgánica de tela y cambio de colores institucionales en 360°.
              </p>
            </div>
            <Uniform3DViewer onAddCustomToCart={handleAddCustomToCart} />
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryView apiUrl={API_URL} />
        )}

        {activeTab === 'partners' && (
          <PartnersView apiUrl={API_URL} />
        )}
      </main>

      {/* Modal de Cotización */}
      <QuotationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Pie de Página del ERP */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-400 space-y-1">
        <p className="font-extrabold text-slate-700">
          MAQUISER SRL • Sistema Integral Cloud ERP Textil & Modelado 3D
        </p>
        <p className="text-[11px] text-slate-400">
          Arquitectura: React 18 • Three.js • Vite • Tailwind CSS • FastAPI • PostgreSQL (Supabase) • Render • Vercel
        </p>
      </footer>
    </div>
  )
}
