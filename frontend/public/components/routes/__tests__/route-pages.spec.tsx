import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RouteLocation, RouteStatus } from '@console/internal/components/routes';
import { RouteKind } from '@console/internal/module/k8s';

describe(RouteLocation.displayName, () => {
  it('renders a https link when TLS Settings', () => {
    const route: RouteKind = {
      apiVersion: 'v1',
      kind: 'Route',
      metadata: {
        name: 'example',
      },
      spec: {
        host: 'www.example.com',
        tls: {
          termination: 'edge',
        },
        wildcardPolicy: 'None',
        to: {
          kind: 'Service',
          name: 'my-service',
          weight: 100,
        },
      },
      status: {
        ingress: [
          {
            host: 'www.example.com',
            conditions: [
              {
                type: 'Admitted',
                status: 'True',
                lastTransitionTime: '2018-04-30T16:55:48Z',
              },
            ],
          },
        ],
      },
    };

    render(<RouteLocation obj={route} />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('https:'));
  });

  it('renders a http link when no TLS Settings', () => {
    const route: RouteKind = {
      apiVersion: 'v1',
      kind: 'Route',
      metadata: {
        name: 'example',
      },
      spec: {
        host: 'www.example.com',
        wildcardPolicy: 'None',
        to: {
          kind: 'Service',
          name: 'my-service',
          weight: 100,
        },
      },
      status: {
        ingress: [
          {
            host: 'www.example.com',
            conditions: [
              {
                type: 'Admitted',
                status: 'True',
                lastTransitionTime: '2018-04-30T16:55:48Z',
              },
            ],
          },
        ],
      },
    };

    render(<RouteLocation obj={route} />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('http:'));
  });

  it('renders oldest admitted ingress', () => {
    const route: RouteKind = {
      apiVersion: 'v1',
      kind: 'Route',
      metadata: {
        name: 'example',
      },
      spec: {
        host: 'www.example.com',
        path: '\\mypath',
        wildcardPolicy: 'None',
        to: {
          kind: 'Service',
          name: 'my-service',
          weight: 100,
        },
      },
      status: {
        ingress: [
          {
            host: 'newer.example.com',
            conditions: [
              {
                type: 'Admitted',
                status: 'True',
                lastTransitionTime: '2019-04-30T16:55:48Z',
              },
            ],
          },
          {
            host: 'www.example.com',
            conditions: [
              {
                type: 'Admitted',
                status: 'True',
                lastTransitionTime: '2018-04-30T16:55:48Z',
              },
            ],
          },
        ],
      },
    };

    render(<RouteLocation obj={route} />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('http://www.example.com'));
  });

  it('renders additional path in url', () => {
    const route: RouteKind = {
      apiVersion: 'v1',
      kind: 'Route',
      metadata: {
        name: 'example',
      },
      spec: {
        host: 'www.example.com',
        path: '\\mypath',
        wildcardPolicy: 'None',
        to: {
          kind: 'Service',
          name: 'my-service',
          weight: 100,
        },
      },
      status: {
        ingress: [
          {
            host: 'www.example.com',
            conditions: [
              {
                type: 'Admitted',
                status: 'True',
                lastTransitionTime: '2018-04-30T16:55:48Z',
              },
            ],
          },
        ],
      },
    };

    render(<RouteLocation obj={route} />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('\\mypath'));
  });

  it('renders Subdomain', () => {
    const route: RouteKind = {
      apiVersion: 'v1',
      kind: 'Route',
      metadata: {
        name: 'example',
      },
      spec: {
        host: 'www.example.com',
        wildcardPolicy: 'Subdomain',
        to: {
          kind: 'Service',
          name: 'my-service',
          weight: 100,
        },
      },
      status: {
        ingress: [
          {
            host: 'www.example.com',
            conditions: [
              {
                type: 'Admitted',
                status: 'True',
                lastTransitionTime: '2018-04-30T16:55:48Z',
              },
            ],
          },
        ],
      },
    };

    render(<RouteLocation obj={route} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('*.example.com')).toBeInTheDocument();
  });

  it('renders non-admitted label', () => {
    const route: RouteKind = {
      apiVersion: 'v1',
      kind: 'Route',
      metadata: {
        name: 'example',
      },
      spec: {
        host: 'www.example.com',
        wildcardPolicy: 'None',
        to: {
          kind: 'Service',
          name: 'my-service',
          weight: 100,
        },
      },
      status: {
        ingress: [
          {
            host: 'www.example.com',
            conditions: [
              {
                type: 'Admitted',
                status: 'False',
                lastTransitionTime: '2018-04-30T16:55:48Z',
              },
            ],
          },
        ],
      },
    };

    render(<RouteLocation obj={route} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('www.example.com')).toBeInTheDocument();
  });
});

describe(RouteStatus.displayName, () => {
  it('renders Accepted status', () => {
    const route: RouteKind = {
      apiVersion: 'v1',
      kind: 'Route',
      metadata: {
        name: 'example',
      },
      spec: {
        to: {
          kind: 'Service',
          name: 'my-service',
          weight: 100,
        },
      },
      status: {
        ingress: [
          {
            conditions: [
              {
                type: 'Admitted',
                status: 'True',
                lastTransitionTime: '2018-04-30T16:55:48Z',
              },
            ],
          },
        ],
      },
    };

    render(<RouteStatus obj={route} />);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('renders Rejected status', () => {
    const route: RouteKind = {
      apiVersion: 'v1',
      kind: 'Route',
      metadata: {
        name: 'example',
      },
      spec: {
        to: {
          kind: 'Service',
          name: 'my-service',
          weight: 100,
        },
      },
      status: {
        ingress: [
          {
            conditions: [
              {
                type: 'Admitted',
                status: 'False',
                lastTransitionTime: '2018-04-30T16:55:48Z',
              },
            ],
          },
        ],
      },
    };

    render(<RouteStatus obj={route} />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('renders Pending status', () => {
    const route: RouteKind = {
      apiVersion: 'v1',
      kind: 'Route',
      metadata: {
        name: 'example',
      },
      spec: {
        to: {
          kind: 'Service',
          name: 'my-service',
          weight: 100,
        },
      },
    };

    render(<RouteStatus obj={route} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
