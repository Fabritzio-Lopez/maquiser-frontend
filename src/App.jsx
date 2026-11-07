import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import LoginView, { PRECONFIGURED_USERS } from './components/LoginView'
import DashboardView from './components/DashboardView'
import SalesView from './components/SalesView'
import ProductionKanbanView from './components/ProductionKanbanView'
import Catalog from './components/Catalog'
import Uniform3DViewer from './components/Uniform3DViewer'
import InventoryView from './components/InventoryView'
import PartnersView from './components/PartnersView'
import QuotationModal from './components/QuotationModal'
import { Sparkles, ShieldAlert } from 'lucide-react'

export default function App() {
  // Estado de usuario autenticado con persistencia en localStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('maquiser_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [activeTab, setActiveTab] = useState('dashboard')
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

  // Ajustar la pestaña activa al iniciar sesión según los permisos del usuario
  useEffect(() => {
    if (currentUser && currentUser.allowed_tabs && currentUser.allowed_tabs.length > 0) {
      if (!currentUser.allowed_tabs.includes(activeTab)) {
        setActiveTab(currentUser.allowed_tabs[0])
      }
    }
  }, [currentUser])

  // Manejo de Inicio de Sesión
  const handleLogin = (user) => {
    setCurrentUser(user)
    try {
      localStorage.setItem('maquiser_user', JSON.stringify(user))
    } catch {}
    const defaultTab = user.allowed_tabs?.[0] || 'dashboard'
    setActiveTab(defaultTab)
  }

  // Manejo de Cierre de Sesión
  const handleLogout = () => {
    setCurrentUser(null)
    try {
      localStorage.removeItem('maquiser_user')
    } catch {}
  }

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

  // Si no hay usuario autenticado, mostrar la pantalla de Inicio de Sesión
  if (!currentUser) {
    return <LoginView apiUrl={API_URL} onLogin={handleLogin} />
  }

  const userCanAccess = (tabId) => {
    return currentUser.allowed_tabs?.includes(tabId)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Barra de Navegación del ERP con Perfil y Roles */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        cartCount={cartItems.length}
        onOpenCart={() => setIsModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Contenido Principal Dinámico con Control de Permisos (RBAC) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 1. DASHBOARD EJECUTIVO */}
        {activeTab === 'dashboard' && userCanAccess('dashboard') && (
          <DashboardView apiUrl={API_URL} setActiveTab={setActiveTab} />
        )}

        {/* 2. VENTAS & CONTRATOS */}
        {activeTab === 'sales' && userCanAccess('sales') && (
          <SalesView apiUrl={API_URL} />
        )}

        {/* 3. TALLER MRP (PRODUCCIÓN TEXTIL) */}
        {activeTab === 'production' && userCanAccess('production') && (
          <ProductionKanbanView
            apiUrl={API_URL}
            canEdit={currentUser.can_edit_production}
          />
        )}

        {/* 4. CATÁLOGO DE PRENDAS TERMINADAS */}
        {activeTab === 'catalog' && userCanAccess('catalog') && (
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

        {/* 5. VISOR 3D (SHOWROOM VIRTUAL) */}
        {activeTab === 'customizer' && userCanAccess('customizer') && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                Modelado Tridimensional en Tiempo Real
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Personalizador 3D de Prendas (GLB / Three.js)</h2>
              <p className="text-xs text-slate-500 mt-1">
                Visualiza modelos 3D reales con caída orgánica de tela, rotación en 360° y zoom libre.
              </p>
            </div>
            <Uniform3DViewer onAddCustomToCart={handleAddCustomToCart} />
          </div>
        )}

        {/* 6. INVENTARIO DE MATERIAS PRIMAS & TELAS */}
        {activeTab === 'inventory' && userCanAccess('inventory') && (
          <InventoryView
            apiUrl={API_URL}
            canEdit={currentUser.can_edit_inventory}
          />
        )}

        {/* 7. DIRECTORIO CRM DE COLEGIOS & CLIENTES */}
        {activeTab === 'partners' && userCanAccess('partners') && (
          <PartnersView apiUrl={API_URL} />
        )}

        {/* Pantalla de Acceso Denegado si se intenta forzar un tab no permitido */}
        {!userCanAccess(activeTab) && (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Módulo Restringido</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tu rol como <strong>{currentUser.role_name}</strong> no tiene permisos de acceso a esta sección.
            </p>
            <button
              onClick={() => setActiveTab(currentUser.allowed_tabs[0])}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md"
            >
              Ir a mi módulo asignado
            </button>
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
