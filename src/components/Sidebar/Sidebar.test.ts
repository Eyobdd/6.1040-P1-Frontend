import { render, screen } from '@testing-library/vue';
import Sidebar from './Sidebar.vue';

describe('Sidebar', () => {
  it('renders the sidebar', () => {
    render(Sidebar);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
