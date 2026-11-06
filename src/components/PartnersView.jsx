import React, { useEffect, useState } from 'react'
import { Users, Plus, Search, Building2, GraduationCap, Phone, Mail, MapPin } from 'lucide-react'

export default function PartnersView({ apiUrl }) {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [newPartner, setNewPartner] = useState({ name: '', tipo_cliente: 'colegio', ciudad: 'Cochabamba', phone: '', email: '', nit_ci: '' })

  const fetchPartners = () => {
    setLoading(true)
    fetch(`${apiUrl}/api/v1/partners`)
      .then(res => res.json())
      .then(data => {
        setPartners(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchPartners()
  }, [apiUrl])

  const handleCreatePartner = (e) => {
    e.preventDefault()
    fetch(`${apiUrl}/api/v1/partners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPartner)
    })
      .then(res => res.json())
      .then(created => {
        setPartners([created, ...partners])
        setShowModal(false)
        setNewPartner({ name: '', tipo_cliente: 'colegio', ciudad: 'Cochabamba', phone: '', email: '', nit_ci: '' })
      })
      .catch(err => alert('Error al crear institución: ' + err.message))
  }

  const filtered = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.ciudad && p.ciudad.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'todos' || p.tipo_cliente === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabecera */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Módulo CRM • Directorio Institucional
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Colegios y Empresas Clientes</h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de convenios escolares y contratos corporativos con Maquiser SRL.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Institución</span>
        </button>
      </div>

      {/* Buscador y Filtro */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'colegio', label: 'Colegios / Escuelas' },
            { id: 'empresa_industrial', label: 'Empresas / Mineras' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de Instituciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((partner) => (
          <div
            key={partner.id}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  partner.tipo_cliente === 'colegio' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {partner.tipo_cliente === 'colegio' ? <GraduationCap className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>

                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {partner.ciudad || 'Bolivia'}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-base text-slate-900">{partner.name}</h4>
                <span className="text-[11px] font-semibold text-blue-600 capitalize">
                  {partner.tipo_cliente === 'colegio' ? 'Unidad Educativa' : 'Empresa Industrial'}
                </span>
              </div>

              <div className="space-y-1.5 pt-2 text-xs text-slate-500">
                {partner.phone && (
                  <p className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{partner.phone}</span>
                  </p>
                )}
                {partner.email && (
                  <p className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{partner.email}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400">NIT: {partner.nit_ci || 'S/N'}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Cliente Activo
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva Institución */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-black text-slate-900">Registrar Nueva Institución</h3>
            <p className="text-xs text-slate-500 mt-1">Agrega un colegio o empresa a la base de datos de Supabase.</p>

            <form onSubmit={handleCreatePartner} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la Institución</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Colegio La Salle"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Cliente</label>
                  <select
                    value={newPartner.tipo_cliente}
                    onChange={(e) => setNewPartner({ ...newPartner, tipo_cliente: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="colegio">Colegio / Escuela</option>
                    <option value="empresa_industrial">Empresa Industrial</option>
                    <option value="particular">Particular</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ciudad</label>
                  <input
                    type="text"
                    required
                    placeholder="Cochabamba"
                    value={newPartner.ciudad}
                    onChange={(e) => setNewPartner({ ...newPartner, ciudad: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="+591 4 4..."
                    value={newPartner.phone}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="contacto@colegio.bo"
                    value={newPartner.email}
                    onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                >
                  Guardar Institución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
