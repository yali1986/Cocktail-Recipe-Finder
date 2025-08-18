import {createRouter, createWebHistory } from 'vue-router'
import InicioView from '@/views/InicioView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        
     {
        path: '/',
        name: 'inicio',
        component: InicioView
     },
      {
        path: '/favoritos',
        name: 'favoritos',
        component: ()=> import('../views/FavoritosView.vue')
     },
      {
        path: '/ia',
        name: 'ia',
        component: ()=> import('../views/IAView.vue')
     }
    ],
    // para el scroll en inicio al resultado de recetas
 scrollBehavior(to, from, savedPosition) {
  if (savedPosition) {
    return savedPosition
  }

  if (to.hash && to.hash !== '#') {   // solo hace scroll si el hash NO está vacío
    return {
      el: to.hash,
      behavior: 'smooth',
    }
  }

  return { top: 0 }
}
})

export default router