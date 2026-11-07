import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  Store, Compass, ShoppingBag, Check, RotateCcw,
  Sparkles, ArrowRight, Layers, ZoomIn, ZoomOut,
  Move, Heart, User, Users, ShieldCheck, Tag
} from 'lucide-react'

// Paleta oficial de colores textiles para teñir las prendas en vivo
const COLOR_PRESETS = [
  { name: 'Azul Marino Clásico', hex: '#16284f', class: 'bg-[#16284f]' },
  { name: 'Blanco Oxford', hex: '#f8fafc', class: 'bg-slate-100 border border-slate-300' },
  { name: 'Gris Plomo Sastre', hex: '#334155', class: 'bg-slate-700' },
  { name: 'Verde Botella / Militar', hex: '#064e3b', class: 'bg-emerald-900' },
  { name: 'Rojo Borgoña / Guindo', hex: '#701a2d', class: 'bg-rose-950' },
  { name: 'Negro Azabache', hex: '#090d16', class: 'bg-slate-950' },
  { name: 'Beige / Arena Escolar', hex: '#c5b497', class: 'bg-[#c5b497]' },
]

// Tipos de tejido textil de confección profesional
const FABRIC_TYPES = [
  { id: 'gabardina', name: 'Gabardina Sarga 65/35', desc: 'Resistente y durable para chaquetas, faldas y uniformes', weight: '245 g/m²' },
  { id: 'pano_casimir', name: 'Casimir / Paño Sastre', desc: 'Caída pesada y raya de planchado nítida para pantalones', weight: '285 g/m²' },
  { id: 'algodon_fleece', name: 'Algodón Fleece Frisado', desc: 'Tacto extra suave y térmico para canguros deportivos', weight: '290 g/m²' },
  { id: 'popelina', name: 'Popelina Algodón Peinado', desc: 'Trama sedosa, fresca y antiarrugas para camisas y blusas', weight: '125 g/m²' },
]

// Catálogo de Prendas en el Showroom Virtual 3D
const STORE_SECTIONS = [
  {
    id: 'overview',
    title: 'Vista Panorámica',
    displayName: 'Showroom Principal Maquiser SRL',
    subtitle: 'Exhibición completa de alta costura, uniformes escolares y corporativos',
    camPos: new THREE.Vector3(0, 2.2, 6.6),
    camLook: new THREE.Vector3(0, 1.15, -1.2),
    category: 'all',
  },
  {
    id: 'chaqueta',
    title: 'Chaqueta',
    displayName: 'Chaqueta Escolar / Institucional',
    subtitle: 'Chaqueta sastre con solapas clásicas, forro interno y corte estructurado',
    category: 'unisex',
    genderLabel: 'Unisex / Escolar',
    modelKey: 'chaqueta',
    modelType: 'glb',
    modelPath: '/models/jacket.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/faizan8684/PowerAppsMR/master/jacket.glb',
    podiumPos: new THREE.Vector3(-4.8, 0, -0.6),
    camPos: new THREE.Vector3(-4.8, 1.35, 1.4),
    camLook: new THREE.Vector3(-4.8, 1.25, -0.6),
    price: 180.0,
    scaleMul: 2.05,
    offsetY: 0.25,
    tagColor: 0x2563eb,
  },
  {
    id: 'falda',
    title: 'Falda Plisada',
    displayName: 'Falda Escolar a Tablas (Dama)',
    subtitle: 'Falda plisada de mujer con 28 tablas sastre, pretina alta y vuelo acampanado',
    category: 'mujer',
    genderLabel: 'Prenda de Mujer',
    modelKey: 'falda',
    modelType: 'procedural_skirt',
    podiumPos: new THREE.Vector3(-2.4, 0, -1.8),
    camPos: new THREE.Vector3(-2.4, 1.25, 0.2),
    camLook: new THREE.Vector3(-2.4, 1.15, -1.8),
    price: 110.0,
    tagColor: 0xec4899,
  },
  {
    id: 'canguro',
    title: 'Canguro',
    displayName: 'Canguro Deportivo & Urbano',
    subtitle: 'Buzo con capucha anatómica, bolsillo frontal canguro y puños con rib elástico',
    category: 'unisex',
    genderLabel: 'Unisex / Deportivo',
    modelKey: 'canguro',
    modelType: 'glb',
    modelPath: '/models/hoodie.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/utku6161-tr/proplus-3d-hoodie/main/public/hoodie.glb',
    podiumPos: new THREE.Vector3(0, 0, -2.6),
    camPos: new THREE.Vector3(0, 1.35, -0.6),
    camLook: new THREE.Vector3(0, 1.25, -2.6),
    price: 145.0,
    scaleMul: 2.15,
    offsetY: 0.35,
    tagColor: 0xf59e0b,
  },
  {
    id: 'pantalon',
    title: 'Pantalón Sastre',
    displayName: 'Pantalón de Vestir Sastre',
    subtitle: 'Pantalón formal con raya de planchado frontal, presillas y bolsillos italianos',
    category: 'unisex',
    genderLabel: 'Unisex / Pantalones',
    modelKey: 'pantalon',
    modelType: 'procedural_pants',
    podiumPos: new THREE.Vector3(2.4, 0, -1.8),
    camPos: new THREE.Vector3(2.4, 1.25, 0.2),
    camLook: new THREE.Vector3(2.4, 1.15, -1.8),
    price: 135.0,
    tagColor: 0x6366f1,
  },
  {
    id: 'camisa',
    title: 'Camisa / Blusa',
    displayName: 'Camisa Oxford & Blusa Dama',
    subtitle: 'Camisería formal y blusas ejecutivas con cuello estructurado y botones de nácar',
    category: 'mujer',
    genderLabel: 'Dama & Ejecutivo',
    modelKey: 'camisa',
    modelType: 'glb',
    modelPath: '/models/shirt.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/adrianhajdin/project_threejs_ai/main/client/public/shirt_baked.glb',
    podiumPos: new THREE.Vector3(4.8, 0, -0.6),
    camPos: new THREE.Vector3(4.8, 1.35, 1.4),
    camLook: new THREE.Vector3(4.8, 1.25, -0.6),
    price: 65.0,
    scaleMul: 2.15,
    offsetY: 0.25,
    tagColor: 0x10b981,
  },
]

export default function Uniform3DViewer({ onAddCustomToCart }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)

  // Referencias para transición suave de cámara hacia prendas
  const targetCamPosRef = useRef(STORE_SECTIONS[0].camPos.clone())
  const targetLookAtRef = useRef(STORE_SECTIONS[0].camLook.clone())
  const isTransitioningRef = useRef(false)

  // Referencias a los modelos 3D en los 5 podios
  const mannequinMeshesRef = useRef({
    chaqueta: null,
    falda: null,
    canguro: null,
    pantalon: null,
    camisa: null,
  })

  // Estados de navegación e interactividad
  const [activeSection, setActiveSection] = useState('overview')
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | 'mujer' | 'unisex'
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_TYPES[0])
  const [loading, setLoading] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)
  const autoRotateRef = useRef(true)

  // ============================================================================
  // INICIALIZACIÓN DE LA ESCENA 3D, ORBITCONTROLS Y LOS 5 MODELOS TEXTILES
  // ============================================================================
  useEffect(() => {
    const currentMount = mountRef.current
    if (!currentMount) return

    const width = currentMount.clientWidth
    const height = currentMount.clientHeight

    // 1. Escena limpia, luminosa y moderna (Ambiente Nórdico / Galería Boutique)
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0xf8fafc)

    // 2. Cámara de perspectiva amplia
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.copy(targetCamPosRef.current)
    cameraRef.current = camera

    // 3. Renderizador fotográfico WebGL con Tone Mapping ACESFilmic
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.18
    rendererRef.current = renderer
    currentMount.appendChild(renderer.domElement)

    // 4. OrbitControls: Rotación libre en cualquier ángulo, paneo y zoom infinito
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.target.copy(targetLookAtRef.current)
    controls.minDistance = 0.5 // Acercamiento máximo para ver detalles de costuras y tablas
    controls.maxDistance = 15.0 // Alejamiento para ver todo el showroom
    controls.enablePan = true // Clic derecho para mover la prenda libremente
    controls.panSpeed = 0.8
    controls.screenSpacePanning = true
    controls.maxPolarAngle = Math.PI
    controls.minPolarAngle = 0.05
    controlsRef.current = controls

    controls.addEventListener('start', () => {
      isTransitioningRef.current = false
    })

    // ==========================================================================
    // ILUMINACIÓN FOTOGRÁFICA 5500K (COLORES REALES SIN DISTORSIÓN)
    // ==========================================================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.85)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.3)
    keyLight.position.set(5, 9, 6)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0003
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.3)
    fillLight.position.set(-6, 7, 4)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.1)
    rimLight.position.set(0, 6, -6)
    scene.add(rimLight)

    // Focos direccionales cenitales sobre cada uno de los 5 podios
    function addPodiumSpotlight(x, z) {
      const spot = new THREE.SpotLight(0xffffff, 2.5, 14, Math.PI / 5, 0.45)
      spot.position.set(x, 4.4, z + 1.2)
      spot.target.position.set(x, 1.2, z)
      spot.castShadow = true
      scene.add(spot)
      scene.add(spot.target)

      const lamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.14, 0.22, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
      )
      lamp.position.set(x, 4.35, z + 1.2)
      lamp.rotation.x = Math.PI / 6
      scene.add(lamp)
    }

    addPodiumSpotlight(-4.8, -0.6) // Chaqueta
    addPodiumSpotlight(-2.4, -1.8) // Falda
    addPodiumSpotlight(0, -2.6)    // Canguro
    addPodiumSpotlight(2.4, -1.8)  // Pantalón
    addPodiumSpotlight(4.8, -0.6)  // Camisa

    // ==========================================================================
    // ARQUITECTURA DEL SHOWROOM: SUELO DE ROBLE CLARO Y PAREDES DE GALERÍA
    // ==========================================================================
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 20),
      new THREE.MeshStandardMaterial({
        color: 0xdfd7cc,
        roughness: 0.45,
        metalness: 0.08,
      })
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = true
    scene.add(floor)

    const gridHelper = new THREE.GridHelper(24, 24, 0xc8bea8, 0xd0c5b0)
    gridHelper.position.y = 0.005
    scene.add(gridHelper)

    // Pared arquitectónica de fondo
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(24, 5.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 })
    )
    backWall.position.set(0, 2.6, -6.0)
    scene.add(backWall)

    // Listones de madera noble decorativos
    for (let x = -10.5; x <= 10.5; x += 0.4) {
      if (Math.abs(x) > 3.4) {
        const slat = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 5.0, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.6 })
        )
        slat.position.set(x, 2.5, -5.85)
        scene.add(slat)
      }
    }

    // Letrero Institucional Maquiser SRL
    const signCanvas = document.createElement('canvas')
    signCanvas.width = 1200
    signCanvas.height = 256
    const sCtx = signCanvas.getContext('2d')
    sCtx.fillStyle = '#0f172a'
    sCtx.fillRect(0, 0, 1200, 256)
    sCtx.strokeStyle = '#2563eb'
    sCtx.lineWidth = 6
    sCtx.strokeRect(10, 10, 1180, 236)
    sCtx.fillStyle = '#ffffff'
    sCtx.font = 'bold 72px sans-serif'
    sCtx.textAlign = 'center'
    sCtx.fillText('MAQUISER SRL', 600, 105)
    sCtx.fillStyle = '#f59e0b'
    sCtx.font = 'bold 34px sans-serif'
    sCtx.fillText('ALTA CONFECCIÓN TEXTIL • UNIFORMES ESCOLARES & CORPORATIVOS', 600, 175)

    const signTexture = new THREE.CanvasTexture(signCanvas)
    const signScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 1.15),
      new THREE.MeshBasicMaterial({ map: signTexture })
    )
    signScreen.position.set(0, 3.6, -5.82)
    scene.add(signScreen)

    // Podios de exhibición de mármol blanco con aro de latón
    function createMarblePodium(x, z, labelText, tagColor) {
      const group = new THREE.Group()
      group.position.set(x, 0, z)

      const baseGeo = new THREE.CylinderGeometry(0.85, 0.92, 0.18, 40)
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 })
      const base = new THREE.Mesh(baseGeo, baseMat)
      base.position.y = 0.09
      base.receiveShadow = true
      group.add(base)

      const ringGeo = new THREE.TorusGeometry(0.86, 0.02, 16, 40)
      const ringMat = new THREE.MeshStandardMaterial({ color: tagColor || 0xd97706, metalness: 0.8, roughness: 0.2 })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 0.18
      group.add(ring)

      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.16, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
      )
      plate.position.set(0, 0.10, 0.90)
      group.add(plate)

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.25, 16),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.15 })
      )
      pole.position.y = 0.72
      pole.castShadow = true
      group.add(pole)

      scene.add(group)
      return group
    }

    createMarblePodium(-4.8, -0.6, 'CHAQUETA', 0x2563eb)
    createMarblePodium(-2.4, -1.8, 'FALDA PLISADA', 0xec4899)
    createMarblePodium(0, -2.6, 'CANGURO', 0xf59e0b)
    createMarblePodium(2.4, -1.8, 'PANTALÓN SASTRE', 0x6366f1)
    createMarblePodium(4.8, -0.6, 'CAMISA / BLUSA', 0x10b981)

    // ==========================================================================
    // 1. CARGA DE MODELOS GLB REALES (CHAQUETA, CANGURO, CAMISA)
    // ==========================================================================
    const loader = new GLTFLoader()

    function loadGLBGarment(sectionId) {
      const section = STORE_SECTIONS.find(s => s.id === sectionId)
      if (!section) return

      const holder = new THREE.Group()
      holder.position.set(section.podiumPos.x, 0.85 + section.offsetY, section.podiumPos.z)
      scene.add(holder)
      mannequinMeshesRef.current[section.modelKey] = holder

      const load = (url, isFallback = false) => {
        loader.load(
          url,
          (gltf) => {
            const root = gltf.scene
            const box = new THREE.Box3().setFromObject(root)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = section.scaleMul / maxDim

            root.scale.setScalar(scale)
            root.position.x = -center.x * scale
            root.position.y = -center.y * scale
            root.position.z = -center.z * scale

            const defaultColor = sectionId === 'chaqueta' ? '#16284f' :
                                 sectionId === 'canguro' ? '#334155' : '#f8fafc'

            root.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                if (child.material) {
                  child.material = child.material.clone()
                  child.material.color = new THREE.Color(defaultColor)
                  child.material.roughness = 0.82
                  child.material.metalness = 0.04
                  child.material.needsUpdate = true
                }
              }
            })

            holder.add(root)
            setLoading(false)
          },
          undefined,
          (err) => {
            console.warn(`Fallback para ${sectionId}...`, err)
            if (!isFallback && section.fallbackUrl) {
              load(section.fallbackUrl, true)
            }
          }
        )
      }

      load(section.modelPath)
    }

    loadGLBGarment('chaqueta')
    loadGLBGarment('canguro')
    loadGLBGarment('camisa')

    // ==========================================================================
    // 2. MODELADO 3D DE ALTA CALIDAD: FALDA ESCOLAR PLISADA DE DAMA (PRENDA DE MUJER)
    // ==========================================================================
    function buildPleatedSkirt() {
      const section = STORE_SECTIONS.find(s => s.id === 'falda')
      const holder = new THREE.Group()
      holder.position.set(section.podiumPos.x, 0.95, section.podiumPos.z)
      scene.add(holder)
      mannequinMeshesRef.current.falda = holder

      const skirtMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#16284f'), // Azul marino escolar por defecto
        roughness: 0.84,
        metalness: 0.03,
        side: THREE.DoubleSide,
      })

      // Maniquí de costura femenino de atelier (torso de lino y cuello de madera noble)
      const mannequinMat = new THREE.MeshStandardMaterial({
        color: 0xe2d9cb, // Lino sastre satinado
        roughness: 0.75,
        metalness: 0.05,
      })

      const torsoGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.65, 32)
      const torso = new THREE.Mesh(torsoGeo, mannequinMat)
      torso.position.y = 0.62
      torso.scale.set(1.0, 1.0, 0.68)
      torso.castShadow = true
      holder.add(torso)

      // Remate de cuello en madera noble de nogal
      const neckCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 0.08, 24),
        new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.5 })
      )
      neckCap.position.y = 0.98
      holder.add(neckCap)

      // A. Malla de Falda a Tablas Plisadas (28 tablas knife-pleats exactas)
      const pleatCount = 28
      const skirtHeight = 0.78
      const skirtGeo = new THREE.CylinderGeometry(0.33, 0.58, skirtHeight, 112, 24, true)
      const pos = skirtGeo.attributes.position

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i) // de +skirtHeight/2 a -skirtHeight/2
        const z = pos.getZ(i)
        const angle = Math.atan2(z, x)
        const currentRadius = Math.sqrt(x * x + z * z)

        // Factor de caída: pliegues apretados en la pretina, vuelo acampanado al ruedo
        const normY = (y + skirtHeight / 2) / skirtHeight // 1 arriba, 0 abajo
        const pleatDepth = 0.032 * (1.1 - normY * 0.35)

        // Función armónica que modela la cara plana exterior y el ángulo afilado sastre
        const pleatPhase = angle * pleatCount
        const wave = Math.sin(pleatPhase) + 0.32 * Math.sin(pleatPhase * 2)

        const newR = currentRadius + wave * pleatDepth
        pos.setX(i, Math.cos(angle) * newR)
        pos.setZ(i, Math.sin(angle) * newR)
      }
      skirtGeo.computeVertexNormals()

      const skirtMesh = new THREE.Mesh(skirtGeo, skirtMaterial)
      skirtMesh.position.y = 0.22
      skirtMesh.castShadow = true
      skirtMesh.receiveShadow = true
      holder.add(skirtMesh)

      // B. Pretina Alta Anatómica de Sastre
      const waistbandGeo = new THREE.CylinderGeometry(0.335, 0.335, 0.08, 48)
      const waistband = new THREE.Mesh(waistbandGeo, skirtMaterial)
      waistband.position.y = 0.22 + skirtHeight / 2 + 0.04
      waistband.scale.set(1.0, 1.0, 0.72)
      waistband.castShadow = true
      holder.add(waistband)

      // Botón lateral de nácar en la pretina
      const button = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.01, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.3 })
      )
      button.position.set(0.34, 0.22 + skirtHeight / 2 + 0.04, 0)
      button.rotation.z = Math.PI / 2
      holder.add(button)

      // Dobladillo inferior con vuelo
      const hemRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.58, 0.012, 12, 64),
        skirtMaterial
      )
      hemRing.position.y = 0.22 - skirtHeight / 2
      hemRing.rotation.x = Math.PI / 2
      holder.add(hemRing)
    }

    // ==========================================================================
    // 3. MODELADO 3D DE ALTA CALIDAD: PANTALÓN DE VESTIR SASTRE (PANTALONES)
    // ==========================================================================
    function buildTailoredTrousers() {
      const section = STORE_SECTIONS.find(s => s.id === 'pantalon')
      const holder = new THREE.Group()
      holder.position.set(section.podiumPos.x, 1.0, section.podiumPos.z)
      scene.add(holder)
      mannequinMeshesRef.current.pantalon = holder

      const pantsMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#334155'), // Gris plomo sastre por defecto
        roughness: 0.85,
        metalness: 0.04,
      })

      const trimDarkMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1e293b'),
        roughness: 0.6,
      })

      // A. Percha de sastre de nogal y poste soporte
      const hanger = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.05, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.4 })
      )
      hanger.position.y = 0.82
      hanger.castShadow = true
      holder.add(hanger)

      // B. Pretina Sastre Superior
      const waistbandGeo = new THREE.CylinderGeometry(0.39, 0.38, 0.12, 48)
      const waistband = new THREE.Mesh(waistbandGeo, pantsMaterial)
      waistband.scale.set(1.0, 1.0, 0.70)
      waistband.position.y = 0.74
      waistband.castShadow = true
      holder.add(waistband)

      // Cinturón de cuero con hebilla metálica satinada
      const beltGeo = new THREE.CylinderGeometry(0.395, 0.395, 0.05, 48)
      const belt = new THREE.Mesh(beltGeo, trimDarkMat)
      belt.scale.set(1.01, 1.0, 0.71)
      belt.position.y = 0.74
      holder.add(belt)

      const buckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.065, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 })
      )
      buckle.position.set(0, 0.74, 0.285)
      holder.add(buckle)

      // Presillas para cinturón (6 presillas en relieve)
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
        const loop = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.11, 0.02), pantsMaterial)
        loop.position.set(Math.sin(angle) * 0.39, 0.74, Math.cos(angle) * 0.27)
        loop.rotation.y = angle
        holder.add(loop)
      }

      // Tapeta central de bragueta (Fly front seam)
      const flyPlacket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.02), pantsMaterial)
      flyPlacket.position.set(0, 0.54, 0.265)
      holder.add(flyPlacket)

      // C. Perneras Continuas con Raya de Planchado Central (Crease Sastre)
      function createTrouserLeg(isRight) {
        const sign = isRight ? 1 : -1
        const legGroup = new THREE.Group()
        legGroup.position.set(sign * 0.20, 0, 0)

        // Muslo y pierna continua de 1.25m con conicidad anatómica
        const legGeo = new THREE.CylinderGeometry(0.18, 0.14, 1.28, 48, 20)
        const pos = legGeo.attributes.position

        // Modelado de la Raya de Planchado Frontal (Pressed crease line)
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i)
          const z = pos.getZ(i)
          // Si está en el frente central de la pierna, extruir la arista hacia afuera
          if (z > 0.08 && Math.abs(x) < 0.05) {
            pos.setZ(i, z + 0.035)
          }
        }
        legGeo.computeVertexNormals()

        const leg = new THREE.Mesh(legGeo, pantsMaterial)
        leg.position.y = 0.06
        leg.castShadow = true
        leg.receiveShadow = true
        legGroup.add(leg)

        // Bolsillo italiano lateral en la cadera
        const pocketWelt = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.04), trimDarkMat)
        pocketWelt.position.set(sign * 0.16, 0.58, 0.06)
        pocketWelt.rotation.z = sign * -0.25
        legGroup.add(pocketWelt)

        // Dobladillo sastre reforzado inferior (Valenciana)
        const cuff = new THREE.Mesh(
          new THREE.CylinderGeometry(0.145, 0.145, 0.06, 32),
          pantsMaterial
        )
        cuff.position.y = -0.55
        legGroup.add(cuff)

        holder.add(legGroup)
      }

      createTrouserLeg(false)
      createTrouserLeg(true)
    }

    buildPleatedSkirt()
    buildTailoredTrousers()

    // ==========================================================================
    // CONTROLES DE TECLADO WASD (CAMINAR LIBREMENTE POR LA TIENDA)
    // ==========================================================================
    const onKeyDown = (e) => {
      const step = 0.35
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        camera.position.z -= step
        controls.target.z -= step
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        camera.position.z += step
        controls.target.z += step
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        camera.position.x -= step
        controls.target.x -= step
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        camera.position.x += step
        controls.target.x += step
      }
    }
    window.addEventListener('keydown', onKeyDown)

    const handleResize = () => {
      if (!currentMount) return
      const newW = currentMount.clientWidth
      const newH = currentMount.clientHeight
      camera.aspect = newW / newH
      camera.updateProjectionMatrix()
      renderer.setSize(newW, newH)
    }
    window.addEventListener('resize', handleResize)

    // ==========================================================================
    // LOOP DE ANIMACIÓN CON ORBITCONTROLS + TRANSICIONES SUAVES
    // ==========================================================================
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      if (isTransitioningRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.08)
        controls.target.lerp(targetLookAtRef.current, 0.08)

        if (
          camera.position.distanceTo(targetCamPosRef.current) < 0.02 &&
          controls.target.distanceTo(targetLookAtRef.current) < 0.02
        ) {
          camera.position.copy(targetCamPosRef.current)
          controls.target.copy(targetLookAtRef.current)
          isTransitioningRef.current = false
        }
      }

      if (autoRotateRef.current) {
        Object.values(mannequinMeshesRef.current).forEach((m) => {
          if (m) m.rotation.y += 0.006
        })
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', handleResize)
      controls.dispose()
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  // ============================================================================
  // ACCIONES DE CÁMARA Y NAVEGACIÓN
  // ============================================================================
  const travelToSection = (sectionId) => {
    setActiveSection(sectionId)
    const section = STORE_SECTIONS.find(s => s.id === sectionId)
    if (section) {
      targetCamPosRef.current.copy(section.camPos)
      targetLookAtRef.current.copy(section.camLook)
      isTransitioningRef.current = true
    }
  }

  // Zoom In / Zoom Out libre
  const handleZoom = (delta) => {
    if (!cameraRef.current || !controlsRef.current) return
    isTransitioningRef.current = false
    const cam = cameraRef.current
    const target = controlsRef.current.target
    const dir = new THREE.Vector3().subVectors(cam.position, target).normalize()
    const dist = cam.position.distanceTo(target)
    const newDist = Math.max(0.5, Math.min(15.0, dist + delta))
    cam.position.copy(target).addScaledVector(dir, newDist)
    controlsRef.current.update()
  }

  // Vistas preestablecidas de inspección
  const setPresetView = (viewType) => {
    if (!cameraRef.current || !controlsRef.current) return
    isTransitioningRef.current = false
    const target = controlsRef.current.target.clone()

    const section = STORE_SECTIONS.find(s => s.id === activeSection)
    const dist = section && section.id !== 'overview' ? 1.6 : 5.2

    if (viewType === 'frente') {
      cameraRef.current.position.set(target.x, target.y + 0.1, target.z + dist)
    } else if (viewType === 'espalda') {
      cameraRef.current.position.set(target.x, target.y + 0.1, target.z - dist)
    } else if (viewType === 'perfil') {
      cameraRef.current.position.set(target.x + dist, target.y + 0.1, target.z)
    } else if (viewType === 'arriba') {
      cameraRef.current.position.set(target.x, target.y + dist, target.z + 0.05)
    } else if (viewType === 'reset') {
      travelToSection(activeSection)
      return
    }

    controlsRef.current.target.copy(target)
    controlsRef.current.update()
  }

  // Tintura en vivo del material de la prenda activa
  const handleColorChange = (col) => {
    setSelectedColor(col)
    const section = STORE_SECTIONS.find(s => s.id === activeSection)
    if (!section || !section.modelKey) return

    const holder = mannequinMeshesRef.current[section.modelKey]
    if (holder) {
      holder.traverse((child) => {
        if (child.isMesh && child.material) {
          // No teñir perchas de madera, cuellos o hebillas doradas
          if (
            child.material.color &&
            child.material.color.getHex() !== 0x5c3d2e && // Madera nogal
            child.material.color.getHex() !== 0xd4af37 && // Hebilla oro
            child.material.color.getHex() !== 0xe2d9cb    // Lino sastre
          ) {
            child.material.color.set(col.hex)
            child.material.needsUpdate = true
          }
        }
      })
    }
  }

  // Toggle del giro suave automático
  const toggleAutoRotate = () => {
    const next = !autoRotate
    setAutoRotate(next)
    autoRotateRef.current = next
  }

  const handleAddToCart = () => {
    const section = STORE_SECTIONS.find(s => s.id === activeSection)
    if (!section || section.id === 'overview') return

    const item = {
      name: `${section.displayName || section.title} (Personalizado en Showroom 3D)`,
      color: selectedColor.name,
      fabric: selectedFabric.name,
      weight: selectedFabric.weight,
      price: section.price || 145.0,
      quantity: 1,
    }
    onAddCustomToCart(item)
  }

  // Filtrado de botones según la categoría seleccionada
  const filteredSections = STORE_SECTIONS.filter((sec) => {
    if (categoryFilter === 'all') return true
    if (sec.id === 'overview') return true
    if (categoryFilter === 'mujer') return sec.category === 'mujer' || sec.id === 'chaqueta'
    if (categoryFilter === 'unisex') return sec.category === 'unisex' || sec.id === 'pantalon'
    return true
  })

  const currentSectionData = STORE_SECTIONS.find(s => s.id === activeSection) || STORE_SECTIONS[0]

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[740px]">
      {/* SHOWROOM VIRTUAL 3D INTERACTIVO */}
      <div className="lg:col-span-8 relative bg-slate-100 flex flex-col justify-between p-5 select-none overflow-hidden min-h-[560px]">
        
        {/* Barra Superior: Filtros de Género / Categoría y Botones de Prenda */}
        <div className="flex justify-between items-center z-20 gap-2 flex-wrap">
          {/* Píldoras de Filtro Rápido */}
          <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto max-w-full">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 text-xs font-black rounded-xl transition-all ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Colección Completa
            </button>
            <button
              onClick={() => setCategoryFilter('mujer')}
              className={`px-2.5 py-1 text-xs font-black rounded-xl transition-all flex items-center space-x-1 ${
                categoryFilter === 'mujer'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-pink-700 hover:bg-pink-50'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Línea Mujer</span>
            </button>
            <button
              onClick={() => setCategoryFilter('unisex')}
              className={`px-2.5 py-1 text-xs font-black rounded-xl transition-all flex items-center space-x-1 ${
                categoryFilter === 'unisex'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Unisex & Pantalones</span>
            </button>
          </div>

          {/* Toggle de Giro */}
          <button
            onClick={toggleAutoRotate}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs font-black border shadow-sm transition-all ${
              autoRotate
                ? 'bg-blue-600 border-blue-700 text-white shadow-blue-500/20'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{autoRotate ? 'Giro: Activo' : 'Giro: Pausado'}</span>
          </button>
        </div>

        {/* Selector de Prendas en el Showroom */}
        <div className="z-20 flex items-center space-x-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto max-w-full my-2">
          {filteredSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => travelToSection(sec.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeSection === sec.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {sec.title}
            </button>
          ))}
        </div>

        {/* Canvas de Three.js */}
        <div className="relative flex-1 flex items-center justify-center my-1">
          <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <span className="text-xs font-black text-slate-800">Cargando Chaqueta, Falda Plisada, Pantalón, Canguro y Camisa...</span>
              <span className="text-[11px] text-slate-500 mt-1">Renderizando tablas sastre, raya de planchado y texturas HD</span>
            </div>
          )}

          {/* BOTONES FLOTANTES DE CONTROL DE CÁMARA */}
          <div className="absolute top-3 right-3 z-20 flex flex-col space-y-1.5">
            <button
              onClick={() => handleZoom(-0.5)}
              className="p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200 transition-all hover:scale-105 active:scale-95"
              title="Acercar Prenda (Zoom +)"
            >
              <ZoomIn className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => handleZoom(0.5)}
              className="p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200 transition-all hover:scale-105 active:scale-95"
              title="Alejar Prenda (Zoom -)"
            >
              <ZoomOut className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setPresetView('reset')}
              className="p-2.5 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200 transition-all hover:scale-105 active:scale-95"
              title="Centrar y Resetear Vista"
            >
              <Move className="w-4 h-4 text-emerald-600" />
            </button>
          </div>

          {/* VISTAS PREESTABLECIDAS */}
          {activeSection !== 'overview' && (
            <div className="absolute bottom-3 left-3 z-20 flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Ángulo:</span>
              <button
                onClick={() => setPresetView('frente')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-all"
              >
                Frente
              </button>
              <button
                onClick={() => setPresetView('espalda')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-all"
              >
                Espalda
              </button>
              <button
                onClick={() => setPresetView('perfil')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-all"
              >
                Perfil
              </button>
              <button
                onClick={() => setPresetView('arriba')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition-all"
              >
                Cenital
              </button>
            </div>
          )}
        </div>

        {/* Guía Rápida de Interacción Libre */}
        <div className="z-20 flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px] font-semibold text-slate-600 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span><strong>Clic Izquierdo:</strong> Rotar en 360° libre</span>
          </div>
          <div className="flex items-center space-x-2">
            <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
            <span><strong>Rueda:</strong> Zoom in / out</span>
          </div>
          <div className="flex items-center space-x-2">
            <Move className="w-3.5 h-3.5 text-blue-600" />
            <span><strong>Clic Derecho:</strong> Mover a gusto</span>
          </div>
        </div>
      </div>

      {/* PANEL LATERAL: INFORMACIÓN, PERSONALIZACIÓN TEXTIL Y COTIZACIÓN */}
      <div className="lg:col-span-4 p-6 lg:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                {currentSectionData.genderLabel || 'Catálogo 3D'}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Luz Neutra 5500K
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              {currentSectionData.displayName || currentSectionData.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{currentSectionData.subtitle}</p>
          </div>

          {activeSection === 'overview' ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Showroom Oficial Maquiser SRL
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Selecciona cualquiera de las 5 prendas para inspeccionar sus detalles en 3D, hacer zoom y personalizar tejidos:
              </p>

              <div className="space-y-2 pt-1">
                {STORE_SECTIONS.filter(s => s.id !== 'overview').map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => travelToSection(sec.id)}
                    className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all flex justify-between items-center group"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                          {sec.title}
                        </span>
                        <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          {sec.genderLabel}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[210px]">{sec.subtitle}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 whitespace-nowrap">
                      Bs. {sec.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Paleta de Tintura en Vivo */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Color de Confección en Vivo
                  </label>
                  <span className="text-xs font-black text-blue-600">{selectedColor.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((col) => (
                    <button
                      key={col.hex}
                      onClick={() => handleColorChange(col)}
                      className={`w-9 h-9 rounded-xl ${col.class} flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm ${
                        selectedColor.hex === col.hex ? 'ring-2 ring-blue-600 ring-offset-2 scale-105 shadow-md' : ''
                      }`}
                      title={col.name}
                    >
                      {selectedColor.hex === col.hex && (
                        <Check className={`w-3.5 h-3.5 ${col.hex === '#f8fafc' || col.hex === '#c5b497' ? 'text-slate-800' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Tejido */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-2">
                  Especificación de Tejido
                </label>
                <div className="space-y-2">
                  {FABRIC_TYPES.map((fab) => (
                    <div
                      key={fab.id}
                      onClick={() => setSelectedFabric(fab)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedFabric.id === fab.id
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-900">{fab.name}</span>
                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          {fab.weight}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{fab.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Precio y Añadir a Cotización */}
        <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
          {activeSection !== 'overview' ? (
            <>
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Precio por Unidad:</span>
                  <span className="text-[11px] text-emerald-600 font-bold">✓ Confección y bordado garantizado</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">
                    Bs. {Number(currentSectionData.price || 145).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => travelToSection('overview')}
                  className="px-3.5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all"
                  title="Ver todo el Showroom"
                >
                  <Store className="w-4 h-4" />
                </button>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black text-xs shadow-xl active:scale-98 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir {currentSectionData.title} a Cotización</span>
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => travelToSection('falda')}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-black text-xs shadow-xl active:scale-98 transition-all"
            >
              <span>Ver Colección de Mujer: Falda a Tablas 3D</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
