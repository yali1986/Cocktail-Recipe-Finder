// /api/cocktail.js
import axios from 'axios'

export default async function handler(req, res) {
  try {
    const { c, i, s, ing } = req.query

    let url = 'https://www.thecocktaildb.com/api/json/v1/1/'

    // Priorizar búsqueda por id, por nombre y por ingrediente
    if (i) {
      url += `lookup.php?i=${i}`
    } else if (s) {
      url += `search.php?s=${s}`
    } else if (ing) {
      url += `filter.php?i=${ing}`
    } else if (c && c !== 'list') {
      // Buscar recetas por categoría
      url += `filter.php?c=${c}`
    } else {
      // Obtener todas las categorías
      url += 'list.php?c=list'
    }

    const response = await axios.get(url)

    // Aseguramos que siempre haya un objeto con 'drinks'
    const data = response.data || { drinks: [] }

    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json(data)
  } catch (error) {
    console.error('Error en el proxy:', error)
    res.status(500).json({ drinks: [] })
  }
}



