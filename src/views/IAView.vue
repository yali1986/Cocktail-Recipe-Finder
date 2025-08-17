<script setup>
    import { useIAStore } from '../stores/ia'
    import { useNotificacionStore } from '../stores/notificaciones'

    const notificacion = useNotificacionStore()
    const store = useIAStore()

    const handleSubmit = () => {
      if(store.prompt.trim() === '') {
        notificacion.$patch({
          texto: 'La búsqueda no puede ir vacia',
          mostrar: true,
          error: true
        })
        return
      }

      store.generarReceta()
    }
</script>

<template>
  
  
  <div class="max-w-4xl mx-auto p-5 lg:p-0">
    <h1 class="text-6xl font-extrabold">Generar Receta con IA</h1>
    <form  
      class='flex flex-col space-y-3 py-10'
      @submit.prevent="handleSubmit"
    >
      <div class="relative">
        <input 
          name="prompt" 
          id="prompt" 
          v-model="store.prompt"
          class="border bg-white p-4 rounded-lg w-full border-slate-800"
          placeholder="Genera una receta Ej. Bebida con Tequila y Fresa"
        />
        <button 
          type="submit" 
          aria-label="Enviar"
          class="cursor-pointer absolute top-1/2 right-5 transform -translate-x-1/2 -translate-y-1/2"
          :class="{'cursor-not-allowed opacity-50' : store.cargando}"
          :disabled="store.cargando"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
            stroke="currentColor" class="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m15 11.25-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </button>
      </div>
    </form>

    <p v-if="store.cargando" class="text-center animate-blink">Generando...</p>
    <div class="py-10 whitespace-pre-wrap">
      {{ store.respuesta }}
    </div>
  </div>
</template>