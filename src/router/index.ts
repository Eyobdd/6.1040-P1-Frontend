import { createRouter, createWebHistory } from 'vue-router';
import TodayView from '../views/TodayView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'today',
      component: TodayView,
    },
    {
      path: '/journal',
      name: 'journal',
      // route level code-splitting
      // this generates a separate chunk (Journal.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/JournalView.vue'),
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import('../views/ScheduleView.vue'),
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/AccountView.vue'),
    },
  ],
});

export default router;
