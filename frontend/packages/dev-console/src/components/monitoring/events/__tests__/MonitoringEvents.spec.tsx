import { render, screen } from '@testing-library/react';
import MonitoringEvents from '../MonitoringEvents';

jest.mock('@console/internal/components/events', () => ({
  EventsList: () => 'EventsList',
}));

describe('Monitoring Dashboard Tab', () => {
  it('should render Events tab under Monitoring page', () => {
    render(<MonitoringEvents />);

    expect(screen.getByText(/EventsList/)).toBeInTheDocument();
  });

  it('should pass props to EventsList component', () => {
    const testProps = { customProp: 'test-value', anotherProp: 123 };
    render(<MonitoringEvents {...(testProps as any)} />);

    expect(screen.getByText(/EventsList/)).toBeInTheDocument();
  });

  it('should render with default props when no props are provided', () => {
    render(<MonitoringEvents />);

    expect(screen.getByText(/EventsList/)).toBeInTheDocument();
  });
});
