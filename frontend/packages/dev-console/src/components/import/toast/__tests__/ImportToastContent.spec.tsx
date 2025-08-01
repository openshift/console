/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import { mockResources } from '../../__mocks__/import-toast-mock';
import ImportToastContent from '../ImportToastContent';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/components/routes', () => ({
  RouteLinkAndCopy: function MockRouteLinkAndCopy(props) {
    const React = require('react');
    return React.createElement(
      'span',
      {
        'data-test': 'route-link-and-copy',
        'data-route': JSON.stringify(props.route),
      },
      'Route Link and Copy',
    );
  },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'devconsole~{{kind}} created successfully.') {
        return `${options.kind} created successfully.`;
      }
      return key;
    },
  }),
}));

describe('ImportToastContent', () => {
  it('should show route details', () => {
    render(<ImportToastContent {...mockResources[0]} />);

    expect(screen.getByTestId('route-link-and-copy')).toBeInTheDocument();
  });

  it('should not show route details', () => {
    render(<ImportToastContent {...mockResources[1]} />);

    expect(screen.queryByTestId('route-link-and-copy')).not.toBeInTheDocument();
  });

  it('should show success message with resource kind', () => {
    render(<ImportToastContent {...mockResources[0]} />);

    expect(screen.getByText('Deployment created successfully.')).toBeInTheDocument();
  });

  it('should render null when no deployed resources', () => {
    const { container } = render(<ImportToastContent deployedResources={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render null when deployed resources is undefined', () => {
    const { container } = render(<ImportToastContent deployedResources={undefined} />);

    expect(container.firstChild).toBeNull();
  });

  it('should show success message without route when no route provided', () => {
    render(<ImportToastContent {...mockResources[1]} />);

    expect(screen.getByText('Deployment created successfully.')).toBeInTheDocument();
    expect(screen.queryByTestId('route-link-and-copy')).not.toBeInTheDocument();
  });
});
