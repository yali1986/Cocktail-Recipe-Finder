import { ref, reactive, onMounted, computed } from 'vue'
import { defineStore } from 'pinia'
import APIService from '../services/APIService.js'
import { useModalStore } from './modal'

export const useBebidasStore = defineStore('bebidas', () => {
  const modal = useModalStore()
  const categorias = ref([])
  const busqueda = reactive({
    nombre: '',
    categoria: ''
  })
  const recetas = ref([])
  const receta = ref({})

  const traducciones = {
    "Cocktail": "Cóctel",
    "Ordinary Drink": "Bebida común",
    "Punch / Party Drink": "Ponche / Bebida de fiesta",
    "Shake": "Batido",
    "Other / Unknown": "Otro / Desconocido",
    "Cocoa": "Cacao",
    "Shot": "Chupito",
    "Coffee / Tea": "Café / Té",
    "Homemade Liqueur": "Licor casero",
    "Beer": "Cerveza",
    "Soft Drink": "Refresco"
  }

  const traduccionesInversas = Object.fromEntries(
    Object.entries(traducciones).map(([en, es]) => [es, en])
  )

  onMounted(async () => {
    try {
      const { data } = await APIService.obtenerCategorias()
      if (data && data.drinks && data.drinks.length > 0) {
        categorias.value = data.drinks.map(catEs => ({
          strCategory: traducciones[catEs.strCategory] || catEs.strCategory
        }))
      } else {
        categorias.value = []
        console.error("No se recibieron categorías")
      }
    } catch (error) {
      console.error('Error cargando categorías:', error)
      categorias.value = []
    }
  })

  // Lista de categorías siempre traducidas (derivada)
  const categoriasEs = computed(() => {
    return categorias.value.map(cat => ({
      strCategory: traducciones[cat.strCategory] || cat.strCategory
    }))
  })

  async function obtenerRecetas() {
  recetas.value = []

  const categoriaOriginal = traduccionesInversas[busqueda.categoria] || busqueda.categoria
  const datosBusqueda = { ...busqueda, categoria: categoriaOriginal }

  try {
    // Utilidades de normalización para comparar ingredientes/nombres
    const normalize = (str) => (str || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    const generateQueryVariants = (q) => {
      const variants = new Set([q])
      if (q.endsWith('y')) variants.add(q.slice(0, -1) + 'ies')
      if (q.endsWith('ies')) variants.add(q.slice(0, -3) + 'y')
      if (q.endsWith('s')) variants.add(q.slice(0, -1))
      variants.add(q + 's')
      return Array.from(variants)
    }
    const ingredientMatchesQuery = (ingredient, query) => {
      const i = normalize(ingredient)
      const base = normalize(query)
      const variants = generateQueryVariants(base)
      return variants.some(v => v && i.includes(v))
    }

    const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '')
    const fetchByIngredientVariants = async (rawQuery) => {
      const q = (rawQuery || '').trim()
      if (!q) return []
      const lower = q.toLowerCase()
      const cap = capitalize(lower)
      const pluralS = lower.endsWith('s') ? lower : `${lower}s`
      const pluralSCap = capitalize(pluralS)
      const ies = lower.endsWith('y') ? `${lower.slice(0, -1)}ies` : lower
      const iesCap = capitalize(ies)
      const candidates = Array.from(new Set([q, lower, cap, pluralS, pluralSCap, ies, iesCap]))

      const results = await Promise.all(
        candidates.map(async (c) => {
          try {
            const res = await APIService.buscarPorIngrediente(c)
            return Array.isArray(res.data?.drinks) ? res.data.drinks : []
          } catch {
            return []
          }
        })
      )
      const flat = results.flat()
      const uniqueById = new Map(flat.map(d => [d.idDrink, d]))
      return Array.from(uniqueById.values())
    }

    // Caso 1: nombre e categoría -> intersección usando endpoints de filtro (más preciso)
    if (busqueda.nombre && categoriaOriginal) {
      const [resCategoria, drinksIngrediente] = await Promise.all([
        APIService.buscarRecetas({ categoria: categoriaOriginal, nombre: '' }),
        fetchByIngredientVariants(busqueda.nombre.trim())
      ])

      const drinksCategoriaRaw = resCategoria.data && resCategoria.data.drinks

      const drinksCategoria = Array.isArray(drinksCategoriaRaw) ? drinksCategoriaRaw : []

      const idsCategoria = new Set(drinksCategoria.map(d => d.idDrink))
      const idsIngrediente = new Set(drinksIngrediente.map(d => d.idDrink))
      const idsInterseccion = Array.from(idsCategoria).filter(id => idsIngrediente.has(id))

      if (idsInterseccion.length > 0) {
        const detalles = []
        for (const id of idsInterseccion) {
          const r = await APIService.buscarReceta(id)
          if (r.data && r.data.drinks && r.data.drinks[0]) {
            detalles.push(r.data.drinks[0])
          }
        }
        recetas.value = detalles
        return
      }

      // Segundo intento: filtrar localmente la categoría por ingredientes/nombre
      const detallesCategoria = []
      for (const d of drinksCategoria) {
        const r = await APIService.buscarReceta(d.idDrink)
        if (r.data && r.data.drinks && r.data.drinks[0]) {
          detallesCategoria.push(r.data.drinks[0])
        }
      }

      const query = busqueda.nombre.trim()
      const filtradas = detallesCategoria.filter(det => {
        const nombreCoincide = normalize(det.strDrink).includes(normalize(query))
        let ingredienteCoincide = false
        for (let i = 1; i <= 15; i++) {
          const ing = det[`strIngredient${i}`]
          if (ing && ingredientMatchesQuery(ing, query)) {
            ingredienteCoincide = true
            break
          }
        }
        return nombreCoincide || ingredienteCoincide
      })
      recetas.value = filtradas
      return
    }

    // Caso 2: solo nombre -> primero por nombre, si no hay resultados por ingrediente
    if (busqueda.nombre) {
      const resNombre = await APIService.buscarRecetas(datosBusqueda)
      let drinksNombre = resNombre.data.drinks
      if (drinksNombre && drinksNombre.length) {
        recetas.value = drinksNombre
        return
      }

      // Fallback por ingrediente
      const drinksIngrediente = await fetchByIngredientVariants(busqueda.nombre)
      recetas.value = drinksIngrediente
      return
    }

    // Caso 3: solo categoría -> obtener detalles completos
    const resCategoriaSolo = await APIService.buscarRecetas(datosBusqueda)
    const drinks = resCategoriaSolo.data.drinks
    if (!drinks) {
      recetas.value = []
      return
    }

    const detalles = []
    for (const d of drinks) {
      const r = await APIService.buscarReceta(d.idDrink)
      if (r.data && r.data.drinks && r.data.drinks[0]) {
        detalles.push(r.data.drinks[0])
      }
    }
    recetas.value = detalles
  } catch (error) {
    console.error('Error al buscar recetas:', error)
    recetas.value = []
  }
}


  async function seleccionarBebida(id) {
    try {
      const { data } = await APIService.buscarReceta(id)
      receta.value = data.drinks[0]
      modal.handleClickModal()
    } catch (error) {
      console.error('Error al seleccionar bebida:', error)
    }
  }

  const noRecetas = computed(() => recetas.value.length === 0)

  return {
    categorias,
    categoriasEs,
    busqueda,
    recetas,
    receta,
    obtenerRecetas,
    seleccionarBebida,
    noRecetas
  }
})
