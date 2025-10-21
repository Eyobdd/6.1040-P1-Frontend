import { render, screen, waitFor } from '@testing-library/vue';
import { userEvent } from '@testing-library/user-event';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import Sidebar from './Sidebar.vue';

const vuetify = createVuetify({
  components,
  directives,
});

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'today', component: { template: '<div>Today</div>' } },
    {
      path: '/journal',
      name: 'journal',
      component: { template: '<div>Journal</div>' },
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: { template: '<div>Schedule</div>' },
    },
    {
      path: '/account',
      name: 'account',
      component: { template: '<div>Account</div>' },
    },
  ],
});

const renderSidebar = () => {
  return render(Sidebar, {
    global: {
      plugins: [router, vuetify],
    },
  });
};

describe('Sidebar', () => {
  beforeEach(async () => {
    await router.push('/');
  });

  describe('Navigation Structure', () => {
    it('renders the main navigation', () => {
      renderSidebar();
      expect(
        screen.getByRole('navigation', { name: 'Main navigation' }),
      ).toBeInTheDocument();
    });

    it('displays all navigation links', () => {
      renderSidebar();
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
    });

    it('displays the Zien logo', () => {
      renderSidebar();
      expect(screen.getByAltText('Zien Logo')).toBeInTheDocument();
    });

    it('displays visible text labels for each nav item', () => {
      renderSidebar();
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Journal')).toBeInTheDocument();
      expect(screen.getByText('Schedule')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  describe('Navigation Routing', () => {
    it('navigates to Today page when Today link is clicked', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await router.push('/journal');

      const todayLink = screen.getByRole('link', { name: 'Today' });
      await user.click(todayLink);

      expect(router.currentRoute.value.path).toBe('/');
    });

    it('navigates to Journal page when Journal link is clicked', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const journalLink = screen.getByRole('link', { name: 'Journal' });
      await user.click(journalLink);

      expect(router.currentRoute.value.path).toBe('/journal');
    });

    it('navigates to Schedule page when Schedule link is clicked', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const scheduleLink = screen.getByRole('link', { name: 'Schedule' });
      await user.click(scheduleLink);

      expect(router.currentRoute.value.path).toBe('/schedule');
    });

    it('navigates to Account page when Account link is clicked', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const accountLink = screen.getByRole('link', { name: 'Account' });
      await user.click(accountLink);

      expect(router.currentRoute.value.path).toBe('/account');
    });
  });

  describe('Hover Behavior - Panel Display', () => {
    it('shows Today panel when hovering over Today icon', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const todayLink = screen.getByRole('link', { name: 'Today' });
      await user.hover(todayLink);

      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: 'today menu' }),
        ).toBeInTheDocument();
      });
      expect(screen.getByText('Recent entries')).toBeInTheDocument();
      expect(screen.getByText('Scheduled calls')).toBeInTheDocument();
      expect(screen.getByText("Today's tasks")).toBeInTheDocument();
    });

    it('shows Journal panel when hovering over Journal icon', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const journalLink = screen.getByRole('link', { name: 'Journal' });
      await user.hover(journalLink);

      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: 'journal menu' }),
        ).toBeInTheDocument();
      });
      expect(screen.getByText('Favourite Entries')).toBeInTheDocument();
      expect(screen.getByText('Current Prompts')).toBeInTheDocument();
      expect(screen.getByText('Past Entries')).toBeInTheDocument();
    });

    it('shows Schedule panel when hovering over Schedule icon', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const scheduleLink = screen.getByRole('link', { name: 'Schedule' });
      await user.hover(scheduleLink);

      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: 'schedule menu' }),
        ).toBeInTheDocument();
      });
      expect(screen.getByText('Upcoming calls')).toBeInTheDocument();
      expect(screen.getByText('Availability')).toBeInTheDocument();
      expect(screen.getByText('Past calls')).toBeInTheDocument();
    });

    it('shows Account panel when hovering over Account icon', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const accountLink = screen.getByRole('link', { name: 'Account' });
      await user.hover(accountLink);

      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: 'account menu' }),
        ).toBeInTheDocument();
      });
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Help & Feedback')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('Hover Behavior - Panel Hiding', () => {
    it('hides panel after 500ms when mouse leaves icon', async () => {
      const user = userEvent.setup({ delay: null });
      renderSidebar();

      const todayLink = screen.getByRole('link', { name: 'Today' });
      await user.hover(todayLink);

      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: 'today menu' }),
        ).toBeInTheDocument();
      });

      await user.unhover(todayLink);

      await waitFor(
        () => {
          expect(
            screen.queryByRole('region', { name: 'today menu' }),
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 },
      );
    });

    it('keeps panel open when moving from icon to panel', async () => {
      const user = userEvent.setup({ delay: null });
      renderSidebar();

      const journalLink = screen.getByRole('link', { name: 'Journal' });
      await user.hover(journalLink);

      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: 'journal menu' }),
        ).toBeInTheDocument();
      });

      const panel = screen.getByRole('region', { name: 'journal menu' });
      await user.hover(panel);

      // Wait a bit to ensure timeout would have fired
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(
        screen.getByRole('region', { name: 'journal menu' }),
      ).toBeInTheDocument();
    });

    it('hides panel immediately when leaving entire sidebar', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = renderSidebar();

      const scheduleLink = screen.getByRole('link', { name: 'Schedule' });
      await user.hover(scheduleLink);

      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: 'schedule menu' }),
        ).toBeInTheDocument();
      });

      const sidebar = container.querySelector('.sidebar-wrapper');
      if (sidebar) {
        await user.unhover(sidebar);
      }

      await waitFor(() => {
        expect(
          screen.queryByRole('region', { name: 'schedule menu' }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Active State Indication', () => {
    it('highlights Today icon when on Today page', async () => {
      await router.push('/');
      renderSidebar();

      const todayLink = screen.getByRole('link', { name: 'Today' });
      expect(todayLink).toHaveClass('active');
    });

    it('highlights Journal icon when on Journal page', async () => {
      await router.push('/journal');
      renderSidebar();

      const journalLink = screen.getByRole('link', { name: 'Journal' });
      expect(journalLink).toHaveClass('active');
    });

    it('highlights Schedule icon when on Schedule page', async () => {
      await router.push('/schedule');
      renderSidebar();

      const scheduleLink = screen.getByRole('link', { name: 'Schedule' });
      expect(scheduleLink).toHaveClass('active');
    });

    it('highlights Account icon when on Account page', async () => {
      await router.push('/account');
      renderSidebar();

      const accountLink = screen.getByRole('link', { name: 'Account' });
      expect(accountLink).toHaveClass('active');
    });

    it('shows hovering state on icon when panel is open', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const todayLink = screen.getByRole('link', { name: 'Today' });
      await user.hover(todayLink);

      await waitFor(() => {
        expect(todayLink).toHaveClass('hovering');
      });
    });
  });
});

