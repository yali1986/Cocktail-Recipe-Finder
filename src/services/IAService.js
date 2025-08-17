import { openrouter } from '../lib/ia'
import {  streamText } from 'ai'

export default {
    async generarReceta(prompt) {
        const resultado = streamText({
            // model: openrouter('meta-llama/llama-3.3-70b-instruct:free'),
            // model: openrouter('google/gemini-2.5-pro-exp-03-25:free'),
            model: openrouter('deepseek/deepseek-chat-v3-0324:free'),
            // model: openrouter('google/gemini-2.0-flash-exp:free'),
            prompt
        })

        return resultado.textStream
    }
}