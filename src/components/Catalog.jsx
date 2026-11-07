import React, { useState, useEffect } from 'react'
import { Plus, Search, Tag, CheckCircle2, AlertCircle, ShoppingCart, RefreshCw } from 'lucide-react'

// Productos de demostración por si la base de datos está vacía o iniciando
const DEMO_PRODUCTS = [
  {
    id: 1,
    name: 'Chaqueta Escolar Sastre Institucional',
    price: 180.0,
    stock: 45,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    category: 'Escolar'
  },
  {
    id: 2,
    name: 'Falda Escolar a Tablas (Dama)',
    price: 110.0,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
    category: 'Mujer'
  },
  {
    id: 3,
    name: 'Pantalón de Vestir Sastre con Raya de Planchado',
    price: 135.0,
    stock: 65,
    image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
    category: 'Pantalones'
  },
  {
    id: 4,
    name: 'Canguro Deportivo Urbano con Capucha',
    price: 145.0,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
    category: 'Deportivo'
  },
  {
    id: 5,
    name: 'Camisa Institucional Manga Larga Oxford',
    price: 65.0,
    stock: 60,
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    category: 'Camisas'
  },
  {
    id: 6,
    name: 'Overol Industrial Térmico Ignífugo',
    price: 195.0,
    stock: 28,
    image_url: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
    category: 'Industrial'
  }
]

export default function Catalog({ apiUrl, onAddToCart }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', image_url: '' })
  const [submitting, setSubmitting] = useState(false)

  // Cargar productos desde FastAPI / Supabase
  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${apiUrl}/api/v1/products`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data)
      } else {
        // Si Supabase devuelve lista vacía, usamos los datos de ejemplo
        setProducts(DEMO_PRODUCTS)
      }
    } catch (err) {
      console.warn('No se pudo conectar al backend local, cargando catálogo de prueba:', err)
      setError('Servidor backend desconectado. Mostrando datos de demostración de Maquiser SRL.')
      setProducts(DEMO_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [apiUrl])

  // Crear nuevo producto en Supabase mediante POST
  const handleCreateProduct = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        name: newProduct.name,
        price: parseFloat(newProduct.price) || 0,
        stock: parseInt(newProduct.stock) || 0,
        image_url: newProduct.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80'
      }

      const res = await fetch(`${apiUrl}/api/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Error al registrar en Supabase')
      const created = await res.json()
      setProducts([created, ...products])
      setShowAddModal(false)
      setNewProduct({ name: '', price: '', stock: '', image_url: '' })
    } catch (err) {
      alert(`No se pudo guardar en Supabase: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Filtrado de productos
  const filteredProducts = products.filter(p => {
    const matchesName = p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesName
  })

  return (
    <div className="space-y-8">
      {/* Barra de Búsqueda y Botón Nuevo */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar uniforme, overol, tela..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
            title="Recargar desde Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Alerta informativa si está en modo demo */}
      {error && (
        <div className="flex items-center space-x-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>{error} Asegúrate de tener corriendo <code>uvicorn main:app --reload</code> en el puerto 8000.</span>
        </div>
      )}

      {/* Grilla de Productos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-4">
              <div className="w-full h-48 bg-slate-200 rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">No se encontraron productos con ese criterio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Imagen del producto */}
                <div className="relative w-full h-52 bg-slate-100 overflow-hidden">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80'
                    }}
                  />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Stock: {product.stock ?? 25} unid.
                  </span>
                </div>

                {/* Detalles */}
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center space-x-1.5 mt-2">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">Confección Maquiser</span>
                  </div>
                </div>
              </div>

              {/* Precio y Botón Cotizar */}
              <div className="p-5 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Precio Unitario</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    Bs. {Number(product.price || product.list_price || 0).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => onAddToCart(product)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Cotizar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Registrar Nuevo Producto en Supabase */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-extrabold text-slate-900">Registrar Producto en Supabase</h3>
            <p className="text-xs text-slate-500 mt-1">
              Este formulario envía una petición POST a <code>/api/v1/products</code> guardando en la nube.
            </p>

            <form onSubmit={handleCreateProduct} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la Prenda</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Polera Piqué Escolar"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio (Bs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="75.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock Disponible</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">URL de Imagen (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
