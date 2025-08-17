import { ref, reactive, onMounted, computed } from 'vue'
import { defineStore } from 'pinia'
import APIService from '../services/APIService'
import { useModalStore } from './modal'


export const useBebidasStore = defineStore('bebidas', () => {
    const modal = useModalStore()
  const categorias = ref([])
  const busqueda = reactive({
      nombre: '',
      categoria: ''
  })
  const recetas = ref([])
  const receta = ref({

  })

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

  onMounted(async function () {
    try {
      const {data: {drinks}} = await APIService.obtenerCategorias()
    categorias.value =  drinks.map(catEs => ({
    strCategory: traducciones[catEs.strCategory] || catEs.strCategory
    }))   
    } catch(error) {
      console.error('Error cargando categorías:', error)
    }     
  })

  async function obtenerRecetas() {
  const categoriaOriginal = traduccionesInversas[busqueda.categoria] || busqueda.categoria
  const datosBusqueda = {
    ...busqueda,
    categoria: categoriaOriginal
  }

  const { data: { drinks } } = await APIService.buscarRecetas(datosBusqueda)
  recetas.value = drinks
}

  async function seleccionarBebida(id) {
  const {data: {drinks}} = await APIService.buscarReceta(id)
  receta.value = drinks[0]

  modal.handleClickModal()
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