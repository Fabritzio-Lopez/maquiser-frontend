import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  Store, Eye, Compass, ShoppingBag, Check, RotateCcw,
  Sparkles, ArrowRight, Layers, ZoomIn, Info, ShieldCheck,
  ChevronLeft, ChevronRight, HelpCircle, HardHat
} from 'lucide-react'

// Colores oficiales para uniformes escolares y ropa industrial
const COLOR_PRESETS = [
  { name: 'Azul Marino Escolar', hex: '#16284f', class: 'bg-[#16284f]' },
  { name: 'Blanco Institucional', hex: '#f8fafc', class: 'bg-slate-100 border border-slate-300' },
  { name: 'Gris Plomo Industrial', hex: '#334155', class: 'bg-slate-700' },
  { name: 'Verde Quirúrgico / Petróleo', hex: '#064e3b', class: 'bg-emerald-900' },
  { name: 'Rojo Borgoña Escolar', hex: '#701a2d', class: 'bg-rose-950' },
  { name: 'Negro Ejecutivo', hex: '#090d16', class: 'bg-slate-950' },
]

// Tipos de tejido textil
const FABRIC_TYPES = [
  { id: 'gabardina', name: 'Gabardina Sarga 65/35', desc: 'Resistente a lavados continuos para colegios', weight: '245 g/m²' },
  { id: 'popelina', name: 'Popelina Algodón Peinado', desc: 'Trama suave para camisería ejecutiva', weight: '125 g/m²' },
  { id: 'ripstop', name: 'Ripstop Ignífugo / Antidesgarro', desc: 'Tejido pesado para minería y construcción', weight: '290 g/m²' },
]

// Secciones de la Tienda Virtual 3D (Showroom Luminoso de Alta Gama)
const STORE_SECTIONS = [
  {
    id: 'overview',
    title: 'Vista Panorámica de la Tienda',
    subtitle: 'Showroom Principal Maquiser SRL • Cochabamba',
    camPos: new THREE.Vector3(0, 1.8, 5.2),
    camLook: new THREE.Vector3(0, 1.1, -1.0),
  },
  {
    id: 'escolar',
    title: 'Isla de Uniformes Escolares',
    subtitle: 'Chaqueta Sastre, Solapas y Ficha Técnica Colegial',
    modelKey: 'uniforme',
    modelPath: '/models/jacket.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/faizan8684/PowerAppsMR/master/jacket.glb',
    podiumPos: new THREE.Vector3(-3.2, 0, -1.2),
    camPos: new THREE.Vector3(-3.2, 1.4, 1.0),
    camLook: new THREE.Vector3(-3.2, 1.3, -1.2),
    price: 180.0,
  },
  {
    id: 'industrial',
    title: 'Isla de Overoles Industriales 3M',
    subtitle: 'Overol Enterizo de Seguridad con Cintas Reflectivas',
    modelKey: 'overol',
    podiumPos: new THREE.Vector3(0, 0, -2.2),
    camPos: new THREE.Vector3(0, 1.3, -0.1),
    camLook: new THREE.Vector3(0, 1.1, -2.2),
    price: 250.0,
  },
  {
    id: 'camiseria',
    title: 'Isla de Camisería Oxford',
    subtitle: 'Camisas Institucionales con Caída Real de Tela',
    modelKey: 'camisa',
    modelPath: '/models/shirt.glb',
    fallbackUrl: 'https://raw.githubusercontent.com/adrianhajdin/project_threejs_ai/main/client/public/shirt_baked.glb',
    podiumPos: new THREE.Vector3(3.2, 0, -1.2),
    camPos: new THREE.Vector3(3.2, 1.4, 1.0),
    camLook: new THREE.Vector3(3.2, 1.3, -1.2),
    price: 65.0,
  },
]

export default function Uniform3DViewer({ onAddCustomToCart }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)

  // Referencias de cámara cinemática suave (LERP)
  const targetCamPosRef = useRef(STORE_SECTIONS[0].camPos.clone())
  const targetLookAtRef = useRef(STORE_SECTIONS[0].camLook.clone())
  const currentLookAtRef = useRef(STORE_SECTIONS[0].camLook.clone())

  // Referencias a los modelos 3D en la tienda
  const mannequinMeshesRef = useRef({ uniforme: null, overol: null, camisa: null })

  // Estados de la tienda
  const [activeSection, setActiveSection] = useState('overview')
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_TYPES[0])
  const [loading, setLoading] = useState(true)
  const [autoRotateMannequin, setAutoRotateMannequin] = useState(true)
  const autoRotateRef = useRef(true)

  // ============================================================================
  // CONSTRUCCIÓN DE LA TIENDA VIRTUAL LUMINOSA Y REALISTA (SHOWROOM 5500K)
  // ============================================================================
  useEffect(() => {
    const currentMount = mountRef.current
    if (!currentMount) return

    const width = currentMount.clientWidth
    const height = currentMount.clientHeight

    // 1. Escena limpia, luminosa y moderna (ambiente nórdico / boutique)
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0xf8fafc) // Fondo blanco cálido de galería de arte

    // 2. Cámara de recorrido en la tienda
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.copy(targetCamPosRef.current)
    cameraRef.current = camera

    // 3. Renderizador fotográfico con Tone Mapping de alta gama
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    rendererRef.current = renderer
    currentMount.appendChild(renderer.domElement)

    // ==========================================================================
    // ILUMINACIÓN FOTOGRÁFICA NEUTRA (SIN TINTES AZULES NI AMARILLOS QUE DISTORSIONEN)
    // ==========================================================================
    // Luz ambiental equilibrada día (5500K blanco neutro)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8)
    scene.add(ambientLight)

    // Luz principal cenital (Simula claraboyas y ventanales del showroom)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    keyLight.position.set(4, 8, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0003
    scene.add(keyLight)

    // Luz suave de relleno frontal para revelar los colores puros
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2)
    fillLight.position.set(-5, 6, 3)
    scene.add(fillLight)

    // Luz de silueta trasera (Rim Light neutra para despegar las prendas del fondo)
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0)
    rimLight.position.set(0, 5, -5)
    scene.add(rimLight)

    // Focos direccionales de techo en blanco puro sobre cada podio
    function addStoreSpotlight(x, z) {
      const spot = new THREE.SpotLight(0xffffff, 2.5, 12, Math.PI / 5, 0.4)
      spot.position.set(x, 4.3, z + 1.2)
      spot.target.position.set(x, 1.2, z)
      spot.castShadow = true
      scene.add(spot)
      scene.add(spot.target)

      // Carcasa del proyector en el techo
      const lampGeo = new THREE.CylinderGeometry(0.09, 0.14, 0.22, 16)
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
      const lamp = new THREE.Mesh(lampGeo, lampMat)
      lamp.position.set(x, 4.25, z + 1.2)
      lamp.rotation.x = Math.PI / 6
      scene.add(lamp)
    }

    addStoreSpotlight(-3.2, -1.2)
    addStoreSpotlight(0, -2.2)
    addStoreSpotlight(3.2, -1.2)

    // ==========================================================================
    // ARQUITECTURA DE LA BOUTIQUE: SUELO DE ROBLE CLARO Y PAREDES DE GALERÍA
    // ==========================================================================
    // Suelo de roble escandinavo claro con acabado satinado elegante
    const floorGeo = new THREE.PlaneGeometry(18, 18)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xdfd7cc, // Tono madera roble claro natural
      roughness: 0.45,
      metalness: 0.08,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    floor.receiveShadow = true
    scene.add(floor)

    // Juntas de tablones de madera
    const gridHelper = new THREE.GridHelper(18, 18, 0xc8bea8, 0xd0c5b0)
    gridHelper.position.y = 0.005
    scene.add(gridHelper)

    // Pared de fondo con panel arquitectónico blanco y listones de nogal
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(18, 4.8, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 })
    )
    backWall.position.set(0, 2.4, -5.5)
    scene.add(backWall)

    // Listones de madera noble decorativos en la pared de fondo
    for (let x = -7.5; x <= 7.5; x += 0.35) {
      if (Math.abs(x) > 3.2) {
        const slat = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 4.6, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.6 })
        )
        slat.position.set(x, 2.4, -5.35)
        scene.add(slat)
      }
    }

    // Cartel Institucional de Maquiser SRL
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 1.1, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.6 })
    )
    signBoard.position.set(0, 3.4, -5.36)
    scene.add(signBoard)

    const signCanvas = document.createElement('canvas')
    signCanvas.width = 1024
    signCanvas.height = 256
    const sCtx = signCanvas.getContext('2d')
    sCtx.fillStyle = '#0f172a'
    sCtx.fillRect(0, 0, 1024, 256)
    sCtx.strokeStyle = '#2563eb'
    sCtx.lineWidth = 6
    sCtx.strokeRect(10, 10, 1004, 236)
    sCtx.fillStyle = '#ffffff'
    sCtx.font = 'bold 74px sans-serif'
    sCtx.textAlign = 'center'
    sCtx.fillText('MAQUISER SRL', 512, 105)
    sCtx.fillStyle = '#f59e0b'
    sCtx.font = 'bold 36px sans-serif'
    sCtx.fillText('SHOWROOM & CONFECCIÓN TEXTIL BOLIVIA', 512, 175)

    const signTexture = new THREE.CanvasTexture(signCanvas)
    const signScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 1.05),
      new THREE.MeshBasicMaterial({ map: signTexture })
    )
    signScreen.position.set(0, 3.4, -5.31)
    scene.add(signScreen)

    // Paredes laterales de galería blanca
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 4.8, 14),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
    )
    leftWall.position.set(-9, 2.4, 0)
    scene.add(leftWall)

    const rightWall = leftWall.clone()
    rightWall.position.set(9, 2.4, 0)
    scene.add(rightWall)

    // Techo moderno con vigas metálicas
    for (let z = -5; z <= 5; z += 2.5) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.18, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 })
      )
      beam.position.set(0, 4.6, z)
      scene.add(beam)
    }

    // ==========================================================================
    // PODIOS DE EXHIBICIÓN DE MÁRMOL BLANCO CON ANILLO DE LATÓN
    // ==========================================================================
    function createMarblePodium(x, z, labelText, tagColor) {
      const group = new THREE.Group()
      group.position.set(x, 0, z)

      // Base cilíndrica de mármol blanco
      const baseGeo = new THREE.CylinderGeometry(0.9, 0.98, 0.18, 40)
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.1 })
      const base = new THREE.Mesh(baseGeo, baseMat)
      base.position.y = 0.09
      base.receiveShadow = true
      group.add(base)

      // Anillo decorativo de latón dorado
      const ringGeo = new THREE.TorusGeometry(0.91, 0.02, 16, 40)
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 0.18
      group.add(ring)

      // Placa identificativa frontal
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.16, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
      )
      plate.position.set(0, 0.10, 0.95)
      group.add(plate)

      // Poste de maniquí
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.15 })
      )
      pole.position.y = 0.7
      pole.castShadow = true
      group.add(pole)

      scene.add(group)
      return group
    }

    createMarblePodium(-3.2, -1.2, 'LÍNEA ESCOLAR', 0x2563eb)
    createMarblePodium(0, -2.2, 'SEGURIDAD INDUSTRIAL', 0xf59e0b)
    createMarblePodium(3.2, -1.2, 'CAMISERÍA OXFORD', 0x10b981)

    // ==========================================================================
    // CARGA DE LOS MODELOS 3D EN CADA ISLA
    // ==========================================================================
    const loader = new GLTFLoader()

    // 1. CARGA DE CHAQUETA ESCOLAR (ISLA IZQUIERDA)
    function loadSchoolJacket() {
      const holder = new THREE.Group()
      holder.position.set(-3.2, 1.05, -1.2)
      scene.add(holder)
      mannequinMeshesRef.current.uniforme = holder

      const load = (url, isFallback = false) => {
        loader.load(
          url,
          (gltf) => {
            const root = gltf.scene
            const box = new THREE.Box3().setFromObject(root)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 1.95 / maxDim

            root.scale.setScalar(scale)
            root.position.x = -center.x * scale
            root.position.y = -center.y * scale
            root.position.z = -center.z * scale

            root.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                if (child.material) {
                  child.material = child.material.clone()
                  child.material.color = new THREE.Color('#16284f') // Azul marino puro
                  child.material.roughness = 0.85
                  child.material.metalness = 0.03
                  child.material.needsUpdate = true
                }
              }
            })
            holder.add(root)
            setLoading(false)
          },
          undefined,
          () => {
            if (!isFallback) load(STORE_SECTIONS[1].fallbackUrl, true)
          }
        )
      }
      load(STORE_SECTIONS[1].modelPath)
    }

    // 2. CONSTRUCCIÓN DE UN AUTÉNTICO OVEROL INDUSTRIAL ENTERIZO 3M (ISLA CENTRAL)
    // (NO ES UN CANGURO: ES UN OVEROL COMPLETO DE SEGURIDAD CON PERNERAS Y CINTAS 3M)
    function buildRealIndustrialCoverall() {
      const holder = new THREE.Group()
      holder.position.set(0, 1.25, -2.2)
      scene.add(holder)
      mannequinMeshesRef.current.overol = holder

      const coverallMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#334155'), // Gris plomo industrial por defecto
        roughness: 0.86,
        metalness: 0.04,
      })

      const trimDarkMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1e293b'),
        roughness: 0.88,
      })

      // Material de cinta reflectiva 3M Scotchlite (plata de alto brillo)
      const reflectiveSilverMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0x64748b, // Emisión luminosa que brilla con la luz
        roughness: 0.15,
        metalness: 0.88,
      })

      const hiVisYellowMat = new THREE.MeshStandardMaterial({
        color: 0xeab308, // Amarillo fluorescente normativo
        roughness: 0.4,
      })

      // A. Torso y Pecho del Overol de Seguridad
      const torso = new THREE.Mesh(
        new THREE.CylinderGeometry(0.58, 0.52, 1.15, 32),
        coverallMat
      )
      torso.scale.set(1.0, 1.0, 0.65)
      torso.position.y = 0.15
      torso.castShadow = true
      holder.add(torso)

      // Cuello alto protector de seguridad (Cuello Mao)
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.26, 0.16, 28, 1, true),
        coverallMat
      )
      collar.position.y = 0.78
      holder.add(collar)

      // Tapeta central cubre-cremallera industrial
      const placket = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.15, 0.04),
        trimDarkMat
      )
      placket.position.set(0, 0.15, 0.36)
      holder.add(placket)

      // Tirador metálico de cremallera
      const puller = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.07, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
      )
      puller.position.set(0, 0.68, 0.39)
      holder.add(puller)

      // Bolsillos cargo en el pecho con tapeta
      const pocketL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.04), coverallMat)
      pocketL.position.set(-0.25, 0.36, 0.35)
      pocketL.rotation.y = 0.18
      holder.add(pocketL)

      const pocketR = pocketL.clone()
      pocketR.position.set(0.25, 0.36, 0.35)
      pocketR.rotation.y = -0.18
      holder.add(pocketR)

      // DOBLE CINTA REFLECTIVA 3M EN EL PECHO (AMARILLO FLÚOR + PLATA)
      const chestBandYellow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.59, 0.57, 0.12, 32),
        hiVisYellowMat
      )
      chestBandYellow.scale.set(1.02, 1.0, 0.67)
      chestBandYellow.position.y = 0.15
      holder.add(chestBandYellow)

      const chestBandSilver = new THREE.Mesh(
        new THREE.CylinderGeometry(0.595, 0.575, 0.07, 32),
        reflectiveSilverMat
      )
      chestBandSilver.scale.set(1.02, 1.0, 0.67)
      chestBandSilver.position.y = 0.15
      holder.add(chestBandSilver)

      // B. Cinturón elástico con presillas
      const belt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.53, 0.51, 0.1, 32),
        trimDarkMat
      )
      belt.scale.set(1.02, 1.0, 0.66)
      belt.position.y = -0.38
      holder.add(belt)

      // C. Mangas Industriales con Cintas Reflectivas
      function createIndustrialSleeve(isRight) {
        const sign = isRight ? 1 : -1
        const armGroup = new THREE.Group()
        armGroup.position.set(sign * 0.54, 0.65, 0)

        // Hombro reforzado
        const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), coverallMat)
        shoulder.scale.set(1.1, 0.8, 1)
        armGroup.add(shoulder)

        // Brazo que cae naturalmente hacia abajo
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.65, 20), coverallMat)
        arm.position.set(sign * 0.06, -0.32, 0)
        arm.rotation.z = sign * -0.18
        armGroup.add(arm)

        // Cinta reflectiva en el brazo
        const armBand = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.18, 0.08, 20), reflectiveSilverMat)
        armBand.position.set(sign * 0.06, -0.30, 0)
        armBand.rotation.z = sign * -0.18
        armGroup.add(armBand)

        // Antebrazo
        const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.6, 20), coverallMat)
        forearm.position.set(sign * 0.11, -0.88, 0.04)
        forearm.rotation.z = sign * -0.12
        armGroup.add(forearm)

        // Puño elástico
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.08, 20), trimDarkMat)
        cuff.position.set(sign * 0.13, -1.18, 0.06)
        armGroup.add(cuff)

        holder.add(armGroup)
      }
      createIndustrialSleeve(false)
      createIndustrialSleeve(true)

      // D. PERNERAS ENTERIZAS DEL OVEROL HASTA EL SUELO (PIERNAS REALES)
      function createCoverallLeg(isRight) {
        const sign = isRight ? 1 : -1
        const legGroup = new THREE.Group()
        legGroup.position.set(sign * 0.25, -0.45, 0)

        // Muslo continuo
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.21, 0.65, 24), coverallMat)
        thigh.position.y = -0.3
        thigh.castShadow = true
        legGroup.add(thigh)

        // Rodillera reforzada de doble tejido
        const knee = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.06), trimDarkMat)
        knee.position.set(0, -0.65, 0.19)
        knee.castShadow = true
        legGroup.add(knee)

        // Pantorrilla / Bota del pantalón
        const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.65, 24), coverallMat)
        calf.position.y = -0.92
        calf.castShadow = true
        legGroup.add(calf)

        // Doble cinta reflectiva 3M en la pierna (debajo de la rodilla)
        const legStripeYellow = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.21, 0.1, 24), hiVisYellowMat)
        legStripeYellow.position.y = -0.92
        legGroup.add(legStripeYellow)

        const legStripeSilver = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.215, 0.06, 24), reflectiveSilverMat)
        legStripeSilver.position.y = -0.92
        legGroup.add(legStripeSilver)

        holder.add(legGroup)
      }
      createCoverallLeg(false)
      createCoverallLeg(true)

      // E. CASCO DE SEGURIDAD INDUSTRIAL EN EL ESTANTE (ACCESORIO DE OBRA)
      const helmetGroup = new THREE.Group()
      helmetGroup.position.set(0.65, -0.2, 0.4)
      helmetGroup.scale.set(0.7, 0.7, 0.7)

      const helmetDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.1 })
      )
      helmetGroup.add(helmetDome)

      const helmetBrim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.33, 0.33, 0.03, 24),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
      )
      helmetBrim.position.y = 0.02
      helmetGroup.add(helmetBrim)

      holder.add(helmetGroup)
    }

    // 3. CARGA DE CAMISA OXFORD (ISLA DERECHA)
    function loadOxfordShirt() {
      const holder = new THREE.Group()
      holder.position.set(3.2, 1.05, -1.2)
      scene.add(holder)
      mannequinMeshesRef.current.camisa = holder

      const load = (url, isFallback = false) => {
        loader.load(
          url,
          (gltf) => {
            const root = gltf.scene
            const box = new THREE.Box3().setFromObject(root)
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 2.1 / maxDim

            root.scale.setScalar(scale)
            root.position.x = -center.x * scale
            root.position.y = -center.y * scale
            root.position.z = -center.z * scale

            root.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                if (child.material) {
                  child.material = child.material.clone()
                  child.material.color = new THREE.Color('#f8fafc') // Blanco puro
                  child.material.roughness = 0.85
                  child.material.metalness = 0.03
                  child.material.needsUpdate = true
                }
              }
            })
            holder.add(root)
            setLoading(false)
          },
          undefined,
          () => {
            if (!isFallback) load(STORE_SECTIONS[3].fallbackUrl, true)
          }
        )
      }
      load(STORE_SECTIONS[3].modelPath)
    }

    // Ejecutar la carga de las tres prendas
    loadSchoolJacket()
    buildRealIndustrialCoverall()
    loadOxfordShirt()

    // ==========================================================================
    // CONTROLES DE INTERACCIÓN DE RATÓN Y TECLADO
    // ==========================================================================
    let isDragging = false
    let prevMousePos = { x: 0, y: 0 }

    const onMouseDown = (e) => {
      isDragging = true
      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e) => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMousePos.x
      const deltaY = e.clientY - prevMousePos.y

      if (activeSection !== 'overview') {
        const activeModel = STORE_SECTIONS.find(s => s.id === activeSection)
        if (activeModel) {
          const m = mannequinMeshesRef.current[activeModel.modelKey]
          if (m) m.rotation.y += deltaX * 0.015
        }
      } else {
        camera.rotation.y -= deltaX * 0.003
        camera.rotation.x -= deltaY * 0.002
      }

      prevMousePos = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => { isDragging = false }

    const onWheel = (e) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.003
      camera.position.z = Math.max(-1.0, Math.min(6.5, camera.position.z))
    }

    const domElement = renderer.domElement
    domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    domElement.addEventListener('wheel', onWheel, { passive: false })

    // Controles por teclado WASD para caminar
    const onKeyDown = (e) => {
      const step = 0.25
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        camera.position.z -= step
      } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        camera.position.z += step
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        camera.position.x -= step
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        camera.position.x += step
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

    // Loop de animación fluido y transición cinemática LERP
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      camera.position.lerp(targetCamPosRef.current, 0.05)
      currentLookAtRef.current.lerp(targetLookAtRef.current, 0.05)
      camera.lookAt(currentLookAtRef.current)

      if (autoRotateRef.current) {
        Object.values(mannequinMeshesRef.current).forEach((m) => {
          if (m) m.rotation.y += 0.005
        })
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
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', handleResize)
      if (currentMount.contains(domElement)) {
        currentMount.removeChild(domElement)
      }
      renderer.dispose()
    }
  }, [])

  // Desplazamiento cinemático de la cámara
  const travelToSection = (sectionId) => {
    setActiveSection(sectionId)
    const section = STORE_SECTIONS.find(s => s.id === sectionId)
    if (section) {
      targetCamPosRef.current.copy(section.camPos)
      targetLookAtRef.current.copy(section.camLook)
    }
  }

  // Cambio de color en vivo sobre el maniquí
  const handleColorChange = (col) => {
    setSelectedColor(col)
    const section = STORE_SECTIONS.find(s => s.id === activeSection)
    if (!section || !section.modelKey) return

    const holder = mannequinMeshesRef.current[section.modelKey]
    if (holder) {
      holder.traverse((child) => {
        if (child.isMesh && child.material) {
          // Si es el overol, no teñir las cintas reflectivas plateadas ni el casco
          if (child.material.color && !child.material.emissive?.r) {
            child.material.color.set(col.hex)
            child.material.needsUpdate = true
          }
        }
      })
    }
  }

  const toggleAutoRotate = () => {
    const next = !autoRotateMannequin
    setAutoRotateMannequin(next)
    autoRotateRef.current = next
  }

  const handleAddToCart = () => {
    const section = STORE_SECTIONS.find(s => s.id === activeSection)
    if (!section || section.id === 'overview') return

    const item = {
      name: `${section.title} (Seleccionado en Showroom 3D)`,
      color: selectedColor.name,
      fabric: selectedFabric.name,
      weight: selectedFabric.weight,
      price: section.price || 180.0,
      quantity: 1,
    }
    onAddCustomToCart(item)
  }

  const currentSectionData = STORE_SECTIONS.find(s => s.id === activeSection)

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
      {/* SHOWROOM VIRTUAL 3D LUMINOSO */}
      <div className="lg:col-span-8 relative bg-slate-100 flex flex-col justify-between p-6 select-none overflow-hidden min-h-[520px]">
        {/* Barra superior de la tienda */}
        <div className="flex justify-between items-center z-20 gap-2 flex-wrap">
          <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-black text-slate-800">
            <Store className="w-4 h-4 text-blue-600" />
            <span>Showroom Virtual 3D • Iluminación Neutra de Alta Gama</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAutoRotate}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border shadow-sm transition-all ${
                autoRotateMannequin
                  ? 'bg-blue-600 border-blue-700 text-white shadow-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${autoRotateMannequin ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              <span>{autoRotateMannequin ? 'Giro de Maniquíes: Activo' : 'Giro: Pausado'}</span>
            </button>
          </div>
        </div>

        {/* Canvas de Three.js */}
        <div className="relative flex-1 flex items-center justify-center my-2">
          <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <span className="text-xs font-black text-slate-800">Cargando Showroom 3D de Maquiser SRL...</span>
              <span className="text-[11px] text-slate-500 mt-1">Renderizando estantes, overol con cintas 3M y maniquíes</span>
            </div>
          )}
        </div>

        {/* Selector de Estantes en la Tienda */}
        <div className="z-20 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-md overflow-x-auto max-w-full">
            {STORE_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => travelToSection(sec.id)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
                  activeSection === sec.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-semibold text-slate-600 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 flex items-center space-x-2">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Camina con <strong>WASD</strong> • Arrastra para girar</span>
          </div>
        </div>
      </div>

      {/* PANEL LATERAL DE DETALLE DE LA PRENDA */}
      <div className="lg:col-span-4 p-6 lg:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                {activeSection === 'overview' ? 'Vista General' : 'Escaparate Activo'}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Luz Neutra 5500K
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-2">{currentSectionData.title}</h2>
            <p className="text-xs text-slate-500 mt-1">{currentSectionData.subtitle}</p>
          </div>

          {activeSection === 'overview' ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Showroom Oficial Maquiser SRL
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Navega por nuestro showroom con iluminación fotográfica equilibrada. Haz clic en una sección para inspeccionar las prendas:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => travelToSection('escolar')}
                  className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">1. Estante de Uniformes Escolares</span>
                    <span className="text-[11px] text-slate-500">Blazer sastre colegial con corte anatómico</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </button>

                <button
                  onClick={() => travelToSection('industrial')}
                  className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">2. Estante de Overoles Industriales</span>
                    <span className="text-[11px] text-slate-500">Overol enterizo continuo con cintas 3M y casco</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </button>

                <button
                  onClick={() => travelToSection('camiseria')}
                  className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">3. Estante de Camisería Oxford</span>
                    <span className="text-[11px] text-slate-500">Camisas con caída suave y botones de nácar</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Selector de Color */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                    Color del Tejido en Tienda
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
                        <Check className={`w-3.5 h-3.5 ${col.hex === '#f8fafc' ? 'text-slate-800' : 'text-white'}`} />
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

        {/* Precio y Botón Cotizar */}
        <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
          {activeSection !== 'overview' ? (
            <>
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Precio Unitario Contrato:</span>
                  <span className="text-[11px] text-emerald-600 font-bold">✓ Confección oficial en Supabase</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">
                    Bs. {Number(currentSectionData.price || 180).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => travelToSection('overview')}
                  className="px-3.5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all"
                  title="Ver todo el showroom"
                >
                  <Store className="w-4 h-4" />
                </button>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black text-xs shadow-xl active:scale-98 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir Esta Prenda a Cotización</span>
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => travelToSection('industrial')}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xl active:scale-98 transition-all"
            >
              <span>Ver Isla de Overoles Industriales 3M</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
