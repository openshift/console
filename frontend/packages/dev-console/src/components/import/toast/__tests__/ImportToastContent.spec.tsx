import { configure, render, screen } from '@testing-library/react';
import { mockResources } from '../../__mocks__/import-toast-mock';
import ImportToastContent from '../ImportToastContent';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/shared/src/components/utils/routes', () => ({
  RouteLinkAndCopy: () => 'Route Link and Copy',
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

    expect(screen.getByText(/Route Link and Copy/)).toBeInTheDocument();
  });

  it('should not show route details', () => {
    render(<ImportToastContent {...mockResources[1]} />);

    expect(screen.queryByText(/Route Link and Copy/)).not.toBeInTheDocument();
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
    const { container } = render(<ImportToastContent deployedResources={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('should show success message without route when no route provided', () => {
    render(<ImportToastContent {...mockResources[1]} />);

    expect(screen.getByText('Deployment created successfully.')).toBeInTheDocument();
    expect(screen.queryByText(/Route Link and Copy/)).not.toBeInTheDocument();
  });
});
