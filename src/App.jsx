import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Catalog from './components/Catalog'
import Uniform3DViewer from './components/Uniform3DViewer'
import QuotationModal from './components/QuotationModal'
import { Sparkles, Layers, Box, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('catalog') // 'catalog' | 'customizer'
  const [cartItems, setCartItems] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [backendStatus, setBackendStatus] = useState(false)

  // URL del backend (Local o variable de entorno de Vercel/Render)
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
    const interval = setInterval(checkBackend, 10000)
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        cartCount={cartItems.length}
        onOpenCart={() => setIsModalOpen(true)}
      />

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-maquiser-900 via-maquiser-800 to-blue-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-blue-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Plataforma Textil Cloud ERP + Three.js 3D</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Manufactura y Confección Textil de Alta Calidad
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
              Sistema integral para Maquiser SRL. Visualiza uniformes escolares e indumentaria de seguridad industrial en 3D interactivo y consulta el inventario en tiempo real sincronizado con Supabase.
            </p>
          </div>

          {/* Botones de acción rápida */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('customizer')}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Box className="w-4 h-4" />
              <span>Abrir Personalizador 3D</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm active:scale-95 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Ver Catálogo</span>
            </button>
          </div>
        </div>
      </section>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'catalog' ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900">Catálogo de Productos Textiles</h2>
              <p className="text-sm text-slate-500">
                Prendas en inventario conectadas mediante API REST a la base de datos PostgreSQL en Supabase.
              </p>
            </div>
            <Catalog apiUrl={API_URL} onAddToCart={handleAddToCart} />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900">Laboratorio de Modelado 3D de Uniformes</h2>
              <p className="text-sm text-slate-500">
                Selecciona tejidos, colores institucionales y configuraciones técnicas con previsualización en Three.js.
              </p>
            </div>
            <Uniform3DViewer onAddCustomToCart={handleAddCustomToCart} />
          </div>
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

      {/* Pie de Página */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-700">
          Proyecto de Grado: Sistema Cloud ERP y Catálogo 3D para Maquiser SRL
        </p>
        <p className="text-slate-400">
          Arquitectura: React 18 • Vite • Tailwind CSS • Three.js • FastAPI • PostgreSQL (Supabase) • Vercel
        </p>
      </footer>
    </div>
  )
}
