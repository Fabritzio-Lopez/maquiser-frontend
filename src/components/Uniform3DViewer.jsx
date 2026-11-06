import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RotateCcw, Palette, Sparkles, Check, ShoppingBag, Eye } from 'lucide-react'

// Colores disponibles para uniformes y prendas industriales
const COLOR_PRESETS = [
  { name: 'Azul Marino Escolar', hex: '#1e3a8a', class: 'bg-blue-900' },
  { name: 'Blanco Institucional', hex: '#f8fafc', class: 'bg-slate-100 border border-slate-300' },
  { name: 'Gris Plomo Industrial', hex: '#475569', class: 'bg-slate-600' },
  { name: 'Verde Quirúrgico / Trabajo', hex: '#065f46', class: 'bg-emerald-800' },
  { name: 'Rojo Borgoña Escolar', hex: '#881337', class: 'bg-rose-900' },
  { name: 'Negro Ejecutivo', hex: '#18181b', class: 'bg-zinc-900' },
]

// Tipos de tejido textil
const FABRIC_TYPES = [
  { id: 'gabardina', name: 'Gabardina 65/35', desc: 'Resistente al uso intensivo escolar', weight: '240 g/m²' },
  { id: 'popelina', name: 'Popelina Algodón', desc: 'Suave y transpirable para camisas', weight: '120 g/m²' },
  { id: 'ripstop', name: 'Ripstop Antidesgarro', desc: 'Tejido reforzado para trabajo industrial', weight: '280 g/m²' },
]

export default function Uniform3DViewer({ onAddCustomToCart }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const meshGroupRef = useRef(null)
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_TYPES[0])
  const [garmentType, setGarmentType] = useState('uniforme') // 'uniforme' | 'overol' | 'camisa'
  const [isRotating, setIsRotating] = useState(true)

  useEffect(() => {
    const currentMount = mountRef.current
    if (!currentMount) return

    // 1. Escena, Cámara y Renderizador Three.js
    const width = currentMount.clientWidth
    const height = currentMount.clientHeight
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0xf8fafc)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0.5, 4.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    currentMount.appendChild(renderer.domElement)

    // 2. Luces de Estudio Textil
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8)
    mainLight.position.set(5, 8, 5)
    mainLight.castShadow = true
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.8)
    fillLight.position.set(-5, 3, -3)
    scene.add(fillLight)

    const backLight = new THREE.DirectionalLight(0xffedd5, 0.6)
    backLight.position.set(0, -4, -4)
    scene.add(backLight)

    // 3. Suelo de estudio con sombra suave
    const floorGeo = new THREE.PlaneGeometry(12, 12)
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.12 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.6
    floor.receiveShadow = true
    scene.add(floor)

    // 4. Creación del Modelo 3D de la Prenda Textil (Procedural Three.js)
    const garmentGroup = new THREE.Group()
    meshGroupRef.current = garmentGroup
    scene.add(garmentGroup)

    buildGarmentGeometry(garmentGroup, selectedColor.hex, garmentType)

    // 5. Controles táctiles y ratón (Mouse Drag para rotar)
    let isDragging = false
    let prevMousePos = { x: 0, y: 0 }

    const onMouseDown = (e) => {
      isDragging = true
      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e) => {
      if (!isDragging || !meshGroupRef.current) return
      const deltaX = e.clientX - prevMousePos.x
      const deltaY = e.clientY - prevMousePos.y

      meshGroupRef.current.rotation.y += deltaX * 0.01
      meshGroupRef.current.rotation.x += deltaY * 0.005
      // Limitar rotación vertical
      meshGroupRef.current.rotation.x = Math.max(-0.4, Math.min(0.4, meshGroupRef.current.rotation.x))

      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => {
      isDragging = false
    }

    const domElement = renderer.domElement
    domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    // Redimensionamiento
    const handleResize = () => {
      if (!currentMount) return
      const newW = currentMount.clientWidth
      const newH = currentMount.clientHeight
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
    }
    window.addEventListener('resize', handleResize)

    // Loop de animación
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (isRotating && !isDragging && meshGroupRef.current) {
        meshGroupRef.current.rotation.y += 0.004
      }
      renderer.render(scene, camera)
    }
    animate()

    // Limpieza al desmontar
    return () => {
      cancelAnimationFrame(animationFrameId)
      domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('resize', handleResize)
      if (currentMount.contains(domElement)) {
        currentMount.removeChild(domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Actualizar textura y color cuando cambien
  useEffect(() => {
    if (meshGroupRef.current) {
      buildGarmentGeometry(meshGroupRef.current, selectedColor.hex, garmentType)
    }
  }, [selectedColor, garmentType])

  // Función constructora del modelo textil
  function buildGarmentGeometry(group, hexColor, type) {
    // Limpiar geometrías previas
    while (group.children.length > 0) {
      const obj = group.children[0]
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
      group.remove(obj)
    }

    const primaryColor = new THREE.Color(hexColor)
    const textileMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.75,
      metalness: 0.08,
      bumpScale: 0.05,
    })

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xf1f5f9),
      roughness: 0.6,
      metalness: 0.1,
    })

    const reflectiveMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd97706),
      roughness: 0.2,
      metalness: 0.8,
    })

    // Torso Principal (Chaqueta / Casaca / Camisa)
    const torsoGeo = new THREE.CylinderGeometry(0.55, 0.48, 1.3, 32)
    const torso = new THREE.Mesh(torsoGeo, textileMat)
    torso.position.y = 0.1
    torso.castShadow = true
    torso.receiveShadow = true
    group.add(torso)

    // Cuello / Solapa
    const collarGeo = new THREE.TorusGeometry(0.3, 0.08, 16, 32)
    const collar = new THREE.Mesh(collarGeo, type === 'camisa' ? accentMat : textileMat)
    collar.rotation.x = Math.PI / 2
    collar.position.y = 0.75
    collar.castShadow = true
    group.add(collar)

    // Manga Izquierda
    const sleeveLeftGeo = new THREE.CylinderGeometry(0.18, 0.14, 1.0, 24)
    const sleeveLeft = new THREE.Mesh(sleeveLeftGeo, textileMat)
    sleeveLeft.position.set(-0.68, 0.15, 0)
    sleeveLeft.rotation.z = Math.PI / 8
    sleeveLeft.castShadow = true
    group.add(sleeveLeft)

    // Manga Derecha
    const sleeveRightGeo = new THREE.CylinderGeometry(0.18, 0.14, 1.0, 24)
    const sleeveRight = new THREE.Mesh(sleeveRightGeo, textileMat)
    sleeveRight.position.set(0.68, 0.15, 0)
    sleeveRight.rotation.z = -Math.PI / 8
    sleeveRight.castShadow = true
    group.add(sleeveRight)

    // Detalles específicos según prenda
    if (type === 'overol') {
      // Bandas reflectivas de seguridad industrial
      const stripeGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.08, 32)
      const stripe = new THREE.Mesh(stripeGeo, reflectiveMat)
      stripe.position.y = 0.2
      group.add(stripe)

      const armStripeGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.06, 24)
      const armStripeL = new THREE.Mesh(armStripeGeo, reflectiveMat)
      armStripeL.position.set(-0.68, 0.15, 0)
      armStripeL.rotation.z = Math.PI / 8
      group.add(armStripeL)

      const armStripeR = new THREE.Mesh(armStripeGeo, reflectiveMat)
      armStripeR.position.set(0.68, 0.15, 0)
      armStripeR.rotation.z = -Math.PI / 8
      group.add(armStripeR)

      // Pantalón de overol inferior
      const legLGeo = new THREE.CylinderGeometry(0.22, 0.18, 1.1, 24)
      const legL = new THREE.Mesh(legLGeo, textileMat)
      legL.position.set(-0.25, -0.95, 0)
      legL.castShadow = true
      group.add(legL)

      const legRGeo = new THREE.CylinderGeometry(0.22, 0.18, 1.1, 24)
      const legR = new THREE.Mesh(legRGeo, textileMat)
      legR.position.set(0.25, -0.95, 0)
      legR.castShadow = true
      group.add(legR)
    } else if (type === 'uniforme') {
      // Escudo bordado institucional en el pecho
      const badgeGeo = new THREE.BoxGeometry(0.12, 0.14, 0.02)
      const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
      const badge = new THREE.Mesh(badgeGeo, badgeMat)
      badge.position.set(-0.22, 0.35, 0.5)
      group.add(badge)

      // Botones frontales
      for (let i = 0; i < 3; i++) {
        const buttonGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16)
        const buttonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b })
        const btn = new THREE.Mesh(buttonGeo, buttonMat)
        btn.rotation.x = Math.PI / 2
        btn.position.set(0, 0.45 - i * 0.28, 0.52)
        group.add(btn)
      }
    }
  }

  const handleAddToCart = () => {
    const item = {
      name: `${garmentType === 'uniforme' ? 'Uniforme Institucional' : garmentType === 'overol' ? 'Overol de Protección Industrial' : 'Camisa Textil'} Personalizado`,
      color: selectedColor.name,
      fabric: selectedFabric.name,
      weight: selectedFabric.weight,
      price: garmentType === 'overol' ? 195.0 : garmentType === 'uniforme' ? 145.0 : 85.0,
      quantity: 1,
    }
    onAddCustomToCart(item)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
      {/* Visor 3D Three.js */}
      <div className="lg:col-span-7 relative bg-gradient-to-b from-slate-100 to-slate-200/80 flex flex-col justify-between p-6">
        {/* Cabecera del visor */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Motor Three.js WebGL Activo</span>
          </div>

          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isRotating
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{isRotating ? 'Auto-rotación' : 'Pausada'}</span>
          </button>
        </div>

        {/* Canvas de Three.js */}
        <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Pie del visor: Ayuda de navegación */}
        <div className="z-10 flex justify-center">
          <p className="text-[12px] text-slate-500 bg-white/75 backdrop-blur-sm px-4 py-1 rounded-full border border-slate-200/60 shadow-sm flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Haz clic y arrastra con el ratón para rotar la prenda en 360°</span>
          </p>
        </div>
      </div>

      {/* Panel de Configuración Textil */}
      <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Configurador en Tiempo Real
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Personalizador de Prendas</h2>
            <p className="text-sm text-slate-500 mt-1">
              Personaliza el tipo de confección, paleta cromática y tejido técnico para Maquiser SRL.
            </p>
          </div>

          {/* 1. Selección de tipo de prenda */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
              1. Tipo de Prenda
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'uniforme', label: 'Uniforme Escolar' },
                { id: 'overol', label: 'Overol Industrial' },
                { id: 'camisa', label: 'Camisa / Blusa' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setGarmentType(t.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    garmentType === t.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Paleta de Color Textil */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                2. Color de Tela
              </label>
              <span className="text-xs font-medium text-slate-500">{selectedColor.name}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PRESETS.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => setSelectedColor(col)}
                  className={`w-9 h-9 rounded-xl ${col.class} flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm ${
                    selectedColor.hex === col.hex ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                  }`}
                  title={col.name}
                >
                  {selectedColor.hex === col.hex && (
                    <Check className={`w-4 h-4 ${col.hex === '#f8fafc' ? 'text-slate-800' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Selección de Tela y Gramaje */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
              3. Tipo de Tela & Composición
            </label>
            <div className="space-y-2">
              {FABRIC_TYPES.map((fab) => (
                <div
                  key={fab.id}
                  onClick={() => setSelectedFabric(fab)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFabric.id === fab.id
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">{fab.name}</span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {fab.weight}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{fab.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen de Precio y Botón Cotizar */}
        <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-semibold text-slate-500">Precio Unitario Estimado:</span>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                Bs. {garmentType === 'overol' ? '195.00' : garmentType === 'uniforme' ? '145.00' : '85.00'}
              </span>
              <span className="text-xs text-slate-400 block">Incluye bordado de logotipo</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-maquiser-800 hover:bg-maquiser-900 text-white font-bold text-sm shadow-lg shadow-blue-900/20 active:scale-98 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Añadir Configuración 3D a la Cotización</span>
          </button>
        </div>
      </div>
    </div>
  )
}
