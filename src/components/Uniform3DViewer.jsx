import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  RotateCcw, Sparkles, Check, ShoppingBag, Eye,
  Maximize2, Camera, RefreshCw, ZoomIn, Info, Shield
} from 'lucide-react'

// Colores oficiales para uniformes escolares y ropa industrial
const COLOR_PRESETS = [
  { name: 'Azul Marino Escolar', hex: '#16284f', class: 'bg-[#16284f]' },
  { name: 'Blanco Institucional', hex: '#f1f5f9', class: 'bg-slate-100 border border-slate-300' },
  { name: 'Gris Plomo Industrial', hex: '#334155', class: 'bg-slate-700' },
  { name: 'Verde Quirúrgico / Petróleo', hex: '#064e3b', class: 'bg-emerald-900' },
  { name: 'Rojo Borgoña Escolar', hex: '#701a2d', class: 'bg-rose-950' },
  { name: 'Negro Ejecutivo', hex: '#0a0d14', class: 'bg-slate-950' },
]

// Tipos de tejido textil
const FABRIC_TYPES = [
  { id: 'gabardina', name: 'Gabardina Sarga 65/35', desc: 'Tejido pesado antiarrugas para uniformes escolares', weight: '245 g/m²' },
  { id: 'popelina', name: 'Popelina Algodón Peinado', desc: 'Trama suave y transpirable para camisas ejecutivas', weight: '125 g/m²' },
  { id: 'ripstop', name: 'Ripstop Ignífugo / Antidesgarro', desc: 'Cuadrícula técnica antidesgarro para trabajo industrial', weight: '290 g/m²' },
]

// Modelos 3D GLB reales
const GARMENT_MODELS = {
  uniforme: {
    name: 'Uniforme Escolar (Chaqueta Sastre)',
    path: '/models/jacket.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/faizan8684/PowerAppsMR/master/jacket.glb',
    scaleMultiplier: 2.1,
    offsetY: -0.15,
    basePrice: 145.0,
  },
  overol: {
    name: 'Indumentaria de Seguridad / Trabajo',
    path: '/models/hoodie.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/utku6161-tr/proplus-3d-hoodie/main/public/hoodie.glb',
    scaleMultiplier: 1.85,
    offsetY: -0.1,
    basePrice: 195.0,
  },
  camisa: {
    name: 'Camisa / Blusa Textil con Caída Real',
    path: '/models/shirt.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/adrianhajdin/project_threejs_ai/main/client/public/shirt_baked.glb',
    scaleMultiplier: 2.3,
    offsetY: -0.1,
    basePrice: 85.0,
  },
}

export default function Uniform3DViewer({ onAddCustomToCart }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const currentModelGroupRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)

  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_TYPES[0])
  const [garmentType, setGarmentType] = useState('uniforme') // 'uniforme' | 'overol' | 'camisa'
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Control de giro automático funcional
  const [isRotating, setIsRotating] = useState(true)
  const isRotatingRef = useRef(true)

  const toggleRotation = () => {
    const next = !isRotating
    setIsRotating(next)
    isRotatingRef.current = next
  }

  // ============================================================================
  // INICIALIZACIÓN THREE.JS STUDIO
  // ============================================================================
  useEffect(() => {
    const currentMount = mountRef.current
    if (!currentMount) return

    const width = currentMount.clientWidth
    const height = currentMount.clientHeight

    // 1. Escena con fondo neutro de estudio textil
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0xf1f5f9)

    // 2. Cámara fotográfica de producto
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.set(0, 0.2, 3.6)
    cameraRef.current = camera

    // 3. Renderizador con tone mapping ACES y sombras suaves
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    rendererRef.current = renderer
    currentMount.appendChild(renderer.domElement)

    // 4. Iluminación de Estudio Profesional (3-Point Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)

    // Luz principal cenital
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    keyLight.position.set(4, 6, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0004
    scene.add(keyLight)

    // Luz de relleno azulada suave
    const fillLight = new THREE.DirectionalLight(0xbfdbfe, 1.1)
    fillLight.position.set(-5, 2, 3)
    scene.add(fillLight)

    // Luz de contorno dorada (Rim Light)
    const rimLight = new THREE.DirectionalLight(0xfef08a, 1.3)
    rimLight.position.set(0, 4, -4)
    scene.add(rimLight)

    // 5. Suelo del estudio con sombra suave
    const floorGeo = new THREE.PlaneGeometry(16, 16)
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.16 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.35
    floor.receiveShadow = true
    scene.add(floor)

    // Pedestal cilíndrico de soporte
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.52, 0.04, 36),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.2 })
    )
    pedestal.position.y = -1.33
    pedestal.receiveShadow = true
    scene.add(pedestal)

    // Grupo de prenda
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    currentModelGroupRef.current = modelGroup

    // 6. Controles de Ratón (Arrastrar para rotar en 360°, rueda para zoom)
    let isDragging = false
    let prevMousePos = { x: 0, y: 0 }

    const onMouseDown = (e) => {
      isDragging = true
      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e) => {
      if (!isDragging || !currentModelGroupRef.current) return
      const deltaX = e.clientX - prevMousePos.x
      const deltaY = e.clientY - prevMousePos.y

      currentModelGroupRef.current.rotation.y += deltaX * 0.008
      currentModelGroupRef.current.rotation.x += deltaY * 0.003
      currentModelGroupRef.current.rotation.x = Math.max(-0.25, Math.min(0.25, currentModelGroupRef.current.rotation.x))

      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => {
      isDragging = false
    }

    const onWheel = (e) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.002
      camera.position.z = Math.max(2.0, Math.min(4.8, camera.position.z))
    }

    const domElement = renderer.domElement
    domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    domElement.addEventListener('wheel', onWheel, { passive: false })

    const handleResize = () => {
      if (!currentMount) return
      const newW = currentMount.clientWidth
      const newH = currentMount.clientHeight
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
    }
    window.addEventListener('resize', handleResize)

    // Loop de animación fluido
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      if (isRotatingRef.current && !isDragging && currentModelGroupRef.current) {
        currentModelGroupRef.current.rotation.y += 0.005
      }
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', handleResize)
      if (currentMount.contains(domElement)) {
        currentMount.removeChild(domElement)
      }
      renderer.dispose()
    }
  }, [])

  // ============================================================================
  // CARGA DEL MODELO 3D GLB REAL CON GLTFLOADER
  // ============================================================================
  useEffect(() => {
    const group = currentModelGroupRef.current
    if (!group) return

    setLoading(true)
    setLoadError(null)

    // Limpiar modelo anterior
    while (group.children.length > 0) {
      const obj = group.children[0]
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
        else obj.material.dispose()
      }
      group.remove(obj)
    }

    const config = GARMENT_MODELS[garmentType]
    const loader = new GLTFLoader()

    // Intentar cargar modelo local de /models/, si no existe cargar CDN fallback
    const loadModel = (url, isFallback = false) => {
      loader.load(
        url,
        (gltf) => {
          const root = gltf.scene

          // Centrar y escalar automáticamente
          const box = new THREE.Box3().setFromObject(root)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = (config.scaleMultiplier || 2.0) / maxDim

          root.scale.setScalar(scale)
          root.position.x = -center.x * scale
          root.position.y = -center.y * scale + (config.offsetY || 0)
          root.position.z = -center.z * scale

          // Aplicar PBR textil, color y sombras
          root.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true
              child.receiveShadow = true
              if (child.material) {
                child.material = child.material.clone()
                child.material.color = new THREE.Color(selectedColor.hex)
                child.material.roughness = 0.85
                child.material.metalness = 0.04
                child.material.needsUpdate = true
              }
            }
          })

          group.add(root)
          setLoading(false)
        },
        undefined,
        (err) => {
          console.warn(`No se pudo cargar desde ${url}, intentando ruta alternativa...`, err)
          if (!isFallback && config.fallbackUrl) {
            loadModel(config.fallbackUrl, true)
          } else {
            setLoadError('Error cargando modelo 3D. Mostrando representación alternativa.')
            setLoading(false)
          }
        }
      )
    }

    loadModel(config.path)
  }, [garmentType])

  // Actualizar color en tiempo real sin recargar el modelo
  useEffect(() => {
    const group = currentModelGroupRef.current
    if (!group) return

    group.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color = new THREE.Color(selectedColor.hex)
        child.material.needsUpdate = true
      }
    })
  }, [selectedColor])

  // Controles de cámara rápida (Frente, Espalda, Perfil)
  const setCameraAngle = (view) => {
    if (!currentModelGroupRef.current || !cameraRef.current) return
    setIsRotating(false)
    isRotatingRef.current = false

    const group = currentModelGroupRef.current
    const camera = cameraRef.current

    if (view === 'front') {
      group.rotation.set(0, 0, 0)
      camera.position.set(0, 0.2, 3.6)
    } else if (view === 'back') {
      group.rotation.set(0, Math.PI, 0)
      camera.position.set(0, 0.2, 3.6)
    } else if (view === 'profile') {
      group.rotation.set(0, Math.PI / 4, 0)
      camera.position.set(0, 0.2, 3.6)
    } else if (view === 'detail') {
      group.rotation.set(0, 0.2, 0)
      camera.position.set(0, 0.35, 2.3) // Zoom cercano al pecho/solapa
    }
  }

  const handleAddToCart = () => {
    const currentGarment = GARMENT_MODELS[garmentType]
    const item = {
      name: `${currentGarment.name} (Modelo 3D Personalizado)`,
      color: selectedColor.name,
      fabric: selectedFabric.name,
      weight: selectedFabric.weight,
      price: currentGarment.basePrice,
      quantity: 1,
    }
    onAddCustomToCart(item)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
      {/* VISOR 3D THREE.JS GLTF REAL */}
      <div className="lg:col-span-7 relative bg-gradient-to-b from-slate-100 via-slate-200/90 to-slate-300 flex flex-col justify-between p-6 select-none">
        {/* Cabecera del visor */}
        <div className="flex justify-between items-center z-10 gap-2 flex-wrap">
          <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-black text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Modelo 3D GLB Textil de Alta Definición</span>
          </div>

          {/* BOTÓN GIRO AUTOMÁTICO FUNCIONAL */}
          <button
            onClick={toggleRotation}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border shadow-sm transition-all ${
              isRotating
                ? 'bg-emerald-600 border-emerald-700 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>{isRotating ? 'Giro Automático: ACTIVO' : 'Giro: PAUSADO'}</span>
          </button>
        </div>

        {/* Canvas de Three.js */}
        <div className="relative flex-1 min-h-[460px] flex items-center justify-center">
          <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

          {/* Estado de carga */}
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <span className="text-xs font-black text-slate-800">Cargando Modelo 3D de Confección...</span>
              <span className="text-[11px] text-slate-500 mt-1">Renderizando malla con pliegues y caídas de tela</span>
            </div>
          )}
        </div>

        {/* Barra inferior: Selectores de Ángulo y Ayuda */}
        <div className="z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {[
              { id: 'front', label: 'Frente' },
              { id: 'profile', label: 'Perfil 45°' },
              { id: 'back', label: 'Espalda' },
              { id: 'detail', label: 'Zoom Pecho' },
            ].map((ang) => (
              <button
                key={ang.id}
                onClick={() => setCameraAngle(ang.id)}
                className="px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-blue-600 active:text-white"
              >
                {ang.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-bold text-slate-600 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 shadow-sm flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Arrastra para girar 360° • Rueda del ratón para Zoom</span>
          </div>
        </div>
      </div>

      {/* PANEL LATERAL DE CONFIGURACIÓN TEXTIL */}
      <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                Maquiser SRL • Confección Textil
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Modelo 3D Realista
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Configurador de Prendas</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Visualiza prendas con caída orgánica y pliegues naturales en 3D en tiempo real sincronizado con Supabase.
            </p>
          </div>

          {/* 1. Selección de Prenda */}
          <div>
            <label className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-2">
              1. Selecciona la Prenda
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'uniforme', label: 'Uniforme Escolar', sub: 'Chaqueta / Blazer' },
                { id: 'overol', label: 'Overol / Seguridad', sub: 'Indumentaria Pesada' },
                { id: 'camisa', label: 'Camisa / Blusa', sub: 'Confección Fina' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setGarmentType(t.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    garmentType === t.id
                      ? 'border-blue-600 bg-blue-50 text-blue-950 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-black text-xs block">{t.label}</span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Paleta de Color */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                2. Color de Tejido
              </label>
              <span className="text-xs font-black text-blue-600">{selectedColor.name}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_PRESETS.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => setSelectedColor(col)}
                  className={`w-10 h-10 rounded-2xl ${col.class} flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm ${
                    selectedColor.hex === col.hex ? 'ring-2 ring-blue-600 ring-offset-2 scale-105 shadow-md' : ''
                  }`}
                  title={col.name}
                >
                  {selectedColor.hex === col.hex && (
                    <Check className={`w-4 h-4 ${col.hex === '#f1f5f9' ? 'text-slate-800' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Selección de Tela y Gramaje */}
          <div>
            <label className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-2">
              3. Tejido Técnico & Gramaje
            </label>
            <div className="space-y-2">
              {FABRIC_TYPES.map((fab) => (
                <div
                  key={fab.id}
                  onClick={() => setSelectedFabric(fab)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedFabric.id === fab.id
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900">{fab.name}</span>
                    <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                      {fab.weight}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{fab.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen de Precio y Botón Cotizar */}
        <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Cotización Unitaria:</span>
              <span className="text-[11px] text-emerald-600 font-bold">✓ Confección y bordado garantizados</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                Bs. {GARMENT_MODELS[garmentType].basePrice.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black text-sm shadow-xl active:scale-98 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Añadir Esta Prenda a la Cotización</span>
          </button>
        </div>
      </div>
    </div>
  )
}
