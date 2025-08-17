import { defineStore } from 'pinia'
import { ref } from 'vue'
import IAService from '../services/IAService'

export const useIAStore = defineStore('ia', () => {
    const prompt = ref('')
    const respuesta = ref('')
    const cargando = ref(false)
    const error = ref('')

  
    function esPromptValido(texto) {
        const clean = texto.trim()
        return clean.length >= 2 
    }

    async function generarReceta() {
        respuesta.value = ''
        error.value = ''

        if (!esPromptValido(prompt.value)) {
            error.value = 'Por favor, escribe un ingrediente o una idea de bebida.'
            return
        }

        cargando.value = true

        try {            
            const promptIA = `Crea una receta de bebida (cóctel, batido, smoothie o café) basada en esto: ${prompt.value}`
            const resultado = await IAService.generarReceta(promptIA)

            for await (const texto of resultado) {
                respuesta.value += texto
            }
        } catch (e) {
            error.value = 'Hubo un error al generar la receta.'
        } finally {
            cargando.value = false
        }
    }

    return {
        prompt,
        respuesta,
        error,
        cargando,
        generarReceta
    }
})