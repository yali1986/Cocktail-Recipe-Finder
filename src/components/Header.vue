<script setup>
import { computed, nextTick } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useBebidasStore } from '../stores/bebidas';
import { useNotificacionStore } from '@/stores/notificaciones';
import { useRouter } from 'vue-router';


const router = useRouter()
const route = useRoute()
const store = useBebidasStore()
const notificaciones = useNotificacionStore()

const paginaInicio = computed(() => route.name === 'inicio')

const handleSubmit = async () => {
  if (!store.busqueda.nombre && !store.busqueda.categoria) {
    notificaciones.$patch({
      texto: 'Ingresa al menos un criterio: nombre o categoría',
      mostrar: true,
      error: true
    })
    return
  }
  
  await store.obtenerRecetas()
  await nextTick() // Espera a que el DOM se actualice

  if (store.recetas && store.recetas.length > 0) {
    // Se ectualiza el hash y el router hará el scroll suave
    router.push({ hash: '#titulo' }) // dispara scroll
  } else {
  router.push({ hash: '' }) // limpia el hash y evita scroll
}
}
</script>


<template>
    <header
    class="bg-slate-800"
    :class="{header : paginaInicio}"
    >
      <div class="mx-auto container px-5 py-16">
        <div class="flex justify-between items-center">
          <div class="bg-white/20 backdrop-blur-md rounded p-4 shadow-lg">
            <RouterLink
              :to="{name: 'inicio'}"
            >
              <img class="w-32" src="/img/logo.svg" alt="Logotipo" />
            </RouterLink>
          </div>
         <nav class="flex gap-4 bg-amber-400/80 backdrop-blur-md p-2 rounded">
  <RouterLink :to="{ name: 'inicio' }" v-slot="{ isExactActive }">
    <span :class="[
      isExactActive ? 'text-[#2B3A4B]' : 'text-white',
      'uppercase font-bold'
    ]">Inicio</span>
  </RouterLink>

  <RouterLink :to="{ name: 'favoritos' }" v-slot="{ isExactActive }">
    <span :class="[
      isExactActive ? 'text-[#2B3A4B]' : 'text-white',
      'uppercase font-bold'
    ]">Favoritos</span>
  </RouterLink>
  
  <RouterLink :to="{ name: 'ia' }" v-slot="{ isExactActive }">
    <span :class="[
      isExactActive ? 'text-[#2B3A4B]' : 'text-white',
      'uppercase font-bold'
    ]">Generar con IA</span>
  </RouterLink>
</nav>

        </div>

        <form 
        v-if="paginaInicio"
        class="md:w-1/2 2xl:w-1/3 bg-[#C5DF86] my-32 p-10 rounded-lg shadow space-y-6 opacity-98"       
        @submit.prevent="handleSubmit"
        >
            <div class="space-y-4">
                <label 
                class="block text-[#2B3A4B] uppercase font-extrabold text-lg"
                for="ingrediente">Nombre o ingrediente <span class="lowercase font-bold">(en inglés)</span></label>
                <input 
                   id="ingrediente"
                   type="text"
                   class="p-3 w-full rounded-lg focus:outline-none bg-white"
                   placeholder="Nombre o ingrediente: ej. Vodka, Tequila, etc."
                   v-model="store.busqueda.nombre"
                >
            </div>

            <div class="space-y-4">
                <label 
                class="block text-[#2B3A4B] uppercase font-extrabold text-lg"
                for="categoria">Categoría</label>
                <select
                   id="categoria"                  
                   class="p-3 w-full rounded-lg focus:outline-none bg-white"  
                   v-model="store.busqueda.categoria"                
                >

                <option value="">-- Seleccione --</option>
                <option
                  v-for="categoria in store.categoriasEs"
                  :key="categoria.strCategory"
                  :value="categoria.strCategory"
                >{{ categoria.strCategory }} </option>
                </select>
            </div>

            <input 
            type="submit"
            class="bg-[#8DB44C] hover:bg-[#FF9706] cursor pointer text-[#2B3A4B] font-extrabold w-full p-4 rounded-lg uppercase shadow-md"
            value="Buscar Recetas"
            />

        </form>

      </div>  
    </header>
    
</template>
<style>
 .header {
    background-image: url('/img/bebidas6.jpeg');
    background-size: cover;
    background-position: center;
 }
</style>

