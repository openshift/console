/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import MonitoringEvents from '../MonitoringEvents';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/components/events', () => ({
  EventsList: function MockEventsList(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'events-list',
        'data-props': JSON.stringify(props),
      },
      'Events List Component',
    );
  },
}));

describe('Monitoring Dashboard Tab', () => {
  it('should render Events tab under Monitoring page', () => {
    render(<MonitoringEvents />);

    expect(screen.getByTestId('events-list')).toBeInTheDocument();
  });

  it('should pass props to EventsList component', () => {
    const testProps = { customProp: 'test-value', anotherProp: 123 };
    render(<MonitoringEvents {...(testProps as any)} />);

    const eventsList = screen.getByTestId('events-list');
    expect(eventsList).toBeInTheDocument();

    const propsData = JSON.parse(eventsList.getAttribute('data-props'));
    expect(propsData.customProp).toBe('test-value');
    expect(propsData.anotherProp).toBe(123);
  });

  it('should render with default props when no props are provided', () => {
    render(<MonitoringEvents />);

    const eventsList = screen.getByTestId('events-list');
    expect(eventsList).toBeInTheDocument();
    expect(screen.getByText('Events List Component')).toBeInTheDocument();
  });
});
