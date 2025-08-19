import api from '../lib/axios.js'

export default {
  // Obtener todas las categorías
  async obtenerCategorias() {
    return api.get('/') // Llama a /api/cocktail
  },

  // Buscar recetas por categoría y/o nombre
  async buscarRecetas({ categoria, nombre }) {
    // Si hay nombre, usamos search.php?s=nombre
    if (nombre) {
      return api.get(`?s=${nombre}`)
    }

    // Si solo hay categoría, usamos filter.php?c=categoria (devuelve solo id y nombre)
    if (categoria) {
      return api.get(`?c=${categoria}`)
    }

    // Si no hay filtro, devuelve todas las categorías
    return api.get('/')
  },

  // Buscar recetas por ingrediente
  async buscarPorIngrediente(ingrediente) {
    return api.get(`?ing=${ingrediente}`)
  },

  // Obtener detalles de una receta por ID
  async buscarReceta(id) {
    return api.get(`?i=${id}`)
  }
}
