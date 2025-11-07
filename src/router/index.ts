import { createRouter, createWebHistory } from 'vue-router';
import { api } from '@/services/api';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout.vue';
import UnauthenticatedLayout from '../layouts/UnauthenticatedLayout.vue';
import DayView from '../views/DayView.vue';
import AuthView from '../views/AuthView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      component: UnauthenticatedLayout,
      children: [
        {
          path: '',
          name: 'auth',
          component: AuthView,
        },
      ],
    },
    {
      path: '/',
      component: AuthenticatedLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dayView',
          component: DayView,
        },
        {
          path: 'reflect',
          name: 'reflect',
          component: () => import('../views/ReflectView.vue'),
        },
        {
          path: 'journal',
          name: 'journal',
          component: () => import('../views/PastEntriesView.vue'),
        },
        {
          path: 'journal/prompts',
          name: 'journalPrompts',
          component: () => import('../views/JournalView.vue'),
        },
        {
          path: 'schedule',
          name: 'schedule',
          component: () => import('../views/ScheduleView.vue'),
        },
        {
          path: 'account',
          name: 'account',
          component: () => import('../views/AccountView.vue'),
        },
      ],
    },
  ],
});

// Auth guard
router.beforeEach(async (to, from, next) => {
  const token = api.getToken();
  
  // Check if any matched route requires auth
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  // If route requires auth and no token, redirect to auth
  if (requiresAuth && !token) {
    next('/auth');
  } 
  // If already logged in and trying to access auth page, redirect to home
  else if (to.path === '/auth' && token) {
    next('/');
  } 
  // Allow navigation
  else {
    next();
  }
});

export default router;
