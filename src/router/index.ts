import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HelloWorldVue from '../components/HelloWorld.vue'
import MapVue from '../components/Map.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/:catchAll(.*)',
    name: 'Home',
    component: HelloWorldVue
  },
  {
    path: '/map',
    name: 'Map',
    component: MapVue
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router;