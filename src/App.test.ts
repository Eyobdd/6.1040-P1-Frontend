import { render, screen } from '@testing-library/vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import App from './App.vue';
import TodayView from './views/TodayView.vue';
import JournalView from './views/JournalView.vue';
import ScheduleView from './views/ScheduleView.vue';
import AccountView from './views/AccountView.vue';

const vuetify = createVuetify({
  components,
  directives,
});

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'today', component: TodayView },
    { path: '/journal', name: 'journal', component: JournalView },
    { path: '/schedule', name: 'schedule', component: ScheduleView },
    { path: '/account', name: 'account', component: AccountView },
  ],
});

const renderApp = async (initialRoute = '/') => {
  await router.push(initialRoute);
  await router.isReady();

  return render(App, {
    global: {
      plugins: [router, vuetify],
    },
  });
};

describe('App', () => {
  describe('Application Structure', () => {
    it('renders the main application container', async () => {
      await renderApp();
      const app = document.querySelector('.zien-app');
      expect(app).toBeInTheDocument();
    });

    it('renders the Sidebar component', async () => {
      await renderApp();
      expect(
        screen.getByRole('navigation', { name: 'Main navigation' }),
      ).toBeInTheDocument();
    });

    it('renders the router view for page content', async () => {
      await renderApp();
      const mainContent = document.querySelector('.main-content');
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('Route Integration', () => {
    it('displays Today view when navigating to root path', async () => {
      await renderApp('/');
      expect(screen.getByAltText('Zien')).toBeInTheDocument();
    });

    it('displays Journal view when navigating to /journal', async () => {
      await renderApp('/journal');
      expect(screen.getByRole('heading', { name: 'Journal' })).toBeInTheDocument();
      expect(
        screen.getByText('This is the journal page.'),
      ).toBeInTheDocument();
    });

    it('displays Schedule view when navigating to /schedule', async () => {
      await renderApp('/schedule');
      expect(screen.getByRole('heading', { name: 'Schedule' })).toBeInTheDocument();
      expect(
        screen.getByText('This is the schedule page.'),
      ).toBeInTheDocument();
    });

    it('displays Account view when navigating to /account', async () => {
      await renderApp('/account');
      expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();
      expect(screen.getByText('User Account')).toBeInTheDocument();
      expect(
        screen.getByText('Manage your account settings and preferences'),
      ).toBeInTheDocument();
    });
  });

  describe('Sidebar and Content Integration', () => {
    it('shows sidebar navigation alongside page content', async () => {
      await renderApp('/');

      // Sidebar should be present
      expect(screen.getByRole('link', { name: 'Today' })).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Journal' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Schedule' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Account' }),
      ).toBeInTheDocument();

      // Page content should be present
      expect(screen.getByAltText('Zien')).toBeInTheDocument();
    });

    it('maintains sidebar presence across route changes', async () => {
      await renderApp('/');

      // Navigate to different routes
      await router.push('/journal');
      expect(
        screen.getByRole('navigation', { name: 'Main navigation' }),
      ).toBeInTheDocument();

      await router.push('/schedule');
      expect(
        screen.getByRole('navigation', { name: 'Main navigation' }),
      ).toBeInTheDocument();

      await router.push('/account');
      expect(
        screen.getByRole('navigation', { name: 'Main navigation' }),
      ).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies main-content class to the main element', async () => {
      await renderApp();
      const mainContent = document.querySelector('.main-content');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent?.tagName).toBe('MAIN');
    });

    it('applies zien-app class to the application container', async () => {
      await renderApp();
      const app = document.querySelector('.zien-app');
      expect(app).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides navigation landmark for sidebar', async () => {
      await renderApp();
      const navigation = screen.getByRole('navigation', {
        name: 'Main navigation',
      });
      expect(navigation).toBeInTheDocument();
    });

    it('provides accessible labels for all navigation links', async () => {
      await renderApp();
      expect(
        screen.getByRole('link', { name: 'Today' }),
      ).toHaveAttribute('aria-label', 'Today');
      expect(
        screen.getByRole('link', { name: 'Journal' }),
      ).toHaveAttribute('aria-label', 'Journal');
      expect(
        screen.getByRole('link', { name: 'Schedule' }),
      ).toHaveAttribute('aria-label', 'Schedule');
      expect(
        screen.getByRole('link', { name: 'Account' }),
      ).toHaveAttribute('aria-label', 'Account');
    });

    it('provides alt text for logo image', async () => {
      await renderApp();
      const logo = screen.getByAltText('Zien Logo');
      expect(logo).toBeInTheDocument();
    });
  });
});
