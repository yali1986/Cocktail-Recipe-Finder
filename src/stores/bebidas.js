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

  async function obtenerRecetas() {
  recetas.value = []

  const categoriaOriginal = traduccionesInversas[busqueda.categoria] || busqueda.categoria
  const datosBusqueda = { ...busqueda, categoria: categoriaOriginal }

  try {
    // Caso 1: nombre e categoría -> intersección
    if (busqueda.nombre && categoriaOriginal) {
      const resCategoria = await APIService.buscarRecetas({ categoria: categoriaOriginal, nombre: '' })
      const drinksCategoria = resCategoria.data.drinks || []

      // Obtener detalles para poder filtrar por ingredientes o nombre
      const detallesCategoria = []
      for (const d of drinksCategoria) {
        const r = await APIService.buscarReceta(d.idDrink)
        if (r.data && r.data.drinks && r.data.drinks[0]) {
          detallesCategoria.push(r.data.drinks[0])
        }
      }

      const query = busqueda.nombre.toLowerCase()
      const filtradas = detallesCategoria.filter(det => {
        const nombreCoincide = (det.strDrink || '').toLowerCase().includes(query)
        let ingredienteCoincide = false
        for (let i = 1; i <= 15; i++) {
          const ing = det[`strIngredient${i}`]
          if (ing && ing.toLowerCase().includes(query)) {
            ingredienteCoincide = true
            break
          }
        }
        return nombreCoincide || ingredienteCoincide
      })

      if (filtradas.length > 0) {
        recetas.value = filtradas
        return
      }

      // Fallback: intentar solo por nombre, y luego por ingrediente
      const resNombreSolo = await APIService.buscarRecetas({ nombre: busqueda.nombre, categoria: '' })
      const drinksNombreSolo = resNombreSolo.data.drinks || []
      if (drinksNombreSolo.length > 0) {
        recetas.value = drinksNombreSolo
        return
      }

      const resIngredienteSolo = await APIService.buscarPorIngrediente(busqueda.nombre)
      recetas.value = resIngredienteSolo.data.drinks || []
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
      const resIngrediente = await APIService.buscarPorIngrediente(busqueda.nombre)
      const drinksIngrediente = resIngrediente.data.drinks || []
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
    busqueda,
    recetas,
    receta,
    obtenerRecetas,
    seleccionarBebida,
    noRecetas
  }
})
