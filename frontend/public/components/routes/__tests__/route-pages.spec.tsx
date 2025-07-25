import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RouteLocation, RouteStatus } from '@console/internal/components/routes';
import { RouteKind } from '@console/internal/module/k8s';

const TEST_CONSTANTS = {
  HOST: 'www.example.com',
  NEWER_HOST: 'newer.example.com',
  PATH: '/mypath',
  TRANSITION_TIME: '2018-04-30T16:55:48Z',
  NEWER_TRANSITION_TIME: '2019-04-30T16:55:48Z',
  SERVICE_NAME: 'my-service',
} as const;

const createMockRoute = (overrides: Partial<RouteKind> = {}): RouteKind => {
  const defaultRoute: RouteKind = {
    apiVersion: 'v1',
    kind: 'Route',
    metadata: {
      name: 'example',
    },
    spec: {
      host: TEST_CONSTANTS.HOST,
      wildcardPolicy: 'None',
      to: {
        kind: 'Service',
        name: TEST_CONSTANTS.SERVICE_NAME,
        weight: 100,
      },
    },
    status: {
      ingress: [
        {
          host: TEST_CONSTANTS.HOST,
          conditions: [
            {
              type: 'Admitted',
              status: 'True',
              lastTransitionTime: TEST_CONSTANTS.TRANSITION_TIME,
            },
          ],
        },
      ],
    },
  };

  // Safe merge that handles nested objects properly
  const result: RouteKind = {
    ...defaultRoute,
    ...overrides,
  };

  // Deep merge nested objects while preserving required properties
  if (overrides.metadata) {
    result.metadata = { ...defaultRoute.metadata, ...overrides.metadata };
  }

  if (overrides.spec) {
    result.spec = {
      ...defaultRoute.spec,
      ...overrides.spec,
      // Ensure required 'to' property is preserved
      to: overrides.spec.to || defaultRoute.spec.to,
    };
  }

  if (overrides.status !== undefined) {
    result.status =
      overrides.status === null ? null : { ...defaultRoute.status, ...overrides.status };
  }

  return result;
};

describe('RouteLocation', () => {
  describe('TLS configuration', () => {
    it('renders https link when TLS is configured', () => {
      const route = createMockRoute({
        spec: {
          ...createMockRoute().spec,
          tls: {
            termination: 'edge',
          },
        },
      });

      render(<RouteLocation obj={route} />);

      const link = screen.getByRole('link');
      expect(link).toBeVisible();
      expect(link).toHaveAttribute('href', `https://${TEST_CONSTANTS.HOST}`);
    });

    it('renders http link when TLS is not configured', () => {
      const route = createMockRoute();

      render(<RouteLocation obj={route} />);

      const link = screen.getByRole('link');
      expect(link).toBeVisible();
      expect(link).toHaveAttribute('href', `http://${TEST_CONSTANTS.HOST}`);
    });
  });

  describe('ingress selection', () => {
    it('renders oldest admitted ingress when multiple ingress exist', () => {
      const route = createMockRoute({
        status: {
          ingress: [
            {
              host: TEST_CONSTANTS.NEWER_HOST,
              conditions: [
                {
                  type: 'Admitted',
                  status: 'True',
                  lastTransitionTime: TEST_CONSTANTS.NEWER_TRANSITION_TIME,
                },
              ],
            },
            {
              host: TEST_CONSTANTS.HOST,
              conditions: [
                {
                  type: 'Admitted',
                  status: 'True',
                  lastTransitionTime: TEST_CONSTANTS.TRANSITION_TIME,
                },
              ],
            },
          ],
        },
      });

      render(<RouteLocation obj={route} />);

      const link = screen.getByRole('link');
      expect(link).toBeVisible();
      expect(link).toHaveAttribute('href', `http://${TEST_CONSTANTS.HOST}`);
    });
  });

  describe('path handling', () => {
    it('renders additional path in URL', () => {
      const route = createMockRoute({
        spec: {
          ...createMockRoute().spec,
          path: TEST_CONSTANTS.PATH,
        },
      });

      render(<RouteLocation obj={route} />);

      const link = screen.getByRole('link');
      expect(link).toBeVisible();
      expect(link).toHaveAttribute('href', `http://${TEST_CONSTANTS.HOST}${TEST_CONSTANTS.PATH}`);
    });
  });

  describe('wildcard policy', () => {
    it('renders subdomain format when wildcard policy is Subdomain', () => {
      const route = createMockRoute({
        spec: {
          ...createMockRoute().spec,
          wildcardPolicy: 'Subdomain',
        },
      });

      render(<RouteLocation obj={route} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('*.example.com')).toBeVisible();
    });
  });

  describe('admission status', () => {
    it('renders non-clickable text when route is not admitted', () => {
      const route = createMockRoute({
        status: {
          ingress: [
            {
              host: TEST_CONSTANTS.HOST,
              conditions: [
                {
                  type: 'Admitted',
                  status: 'False',
                  lastTransitionTime: TEST_CONSTANTS.TRANSITION_TIME,
                },
              ],
            },
          ],
        },
      });

      render(<RouteLocation obj={route} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText(TEST_CONSTANTS.HOST)).toBeVisible();
    });
  });
});

describe('RouteStatus', () => {
  describe('admission status', () => {
    it('renders Accepted status when route is admitted', () => {
      const route = createMockRoute();

      render(<RouteStatus obj={route} />);

      expect(screen.getByText('Accepted')).toBeVisible();
    });

    it('renders Rejected status when route is not admitted', () => {
      const route = createMockRoute({
        status: {
          ingress: [
            {
              conditions: [
                {
                  type: 'Admitted',
                  status: 'False',
                  lastTransitionTime: TEST_CONSTANTS.TRANSITION_TIME,
                },
              ],
            },
          ],
        },
      });

      render(<RouteStatus obj={route} />);

      expect(screen.getByText('Rejected')).toBeVisible;
    });

    it('renders Pending status when route has no status', () => {
      const route: RouteKind = {
        apiVersion: 'v1',
        kind: 'Route',
        metadata: {
          name: 'example',
        },
        spec: {
          host: TEST_CONSTANTS.HOST,
          wildcardPolicy: 'None',
          to: {
            kind: 'Service',
            name: TEST_CONSTANTS.SERVICE_NAME,
            weight: 100,
          },
        },
      };

      render(<RouteStatus obj={route} />);

      expect(screen.getByText('Pending')).toBeVisible;
    });

    it('renders Rejected status when route has empty ingress (no admitted routes)', () => {
      const route = createMockRoute({
        status: {
          ingress: [],
        },
      });

      render(<RouteStatus obj={route} />);

      expect(screen.getByText('Rejected')).toBeVisible();
    });
  });
});
