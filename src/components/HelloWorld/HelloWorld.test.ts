import { render, screen } from '@testing-library/vue';
import HelloWorld from './HelloWorld.vue';

describe('HelloWorld', () => {
  it('renders a message', () => {
    const msg = 'Hello, World!';
    render(HelloWorld, {
      props: { msg },
    });
    expect(screen.getByText(msg)).toBeInTheDocument();
  });
});
