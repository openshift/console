import * as React from 'react';
import { shallow, mount } from 'enzyme';

import { RouteLocation, RouteStatus } from '../../public/components/routes';
import { ExternalLink } from '../../public/components/utils';
import { RouteKind } from '../../public/module/k8s';

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

    const wrapper = shallow(<RouteLocation obj={route} />);
    expect(wrapper.find(ExternalLink).exists()).toBe(true);
    expect(wrapper.find(ExternalLink).props().href).toContain('https:');
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

    const wrapper = shallow(<RouteLocation obj={route} />);
    expect(wrapper.find(ExternalLink).exists()).toBe(true);
    expect(wrapper.find(ExternalLink).props().href).toContain('http:');
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

    const wrapper = shallow(<RouteLocation obj={route} />);
    expect(wrapper.find(ExternalLink).exists()).toBe(true);
    expect(wrapper.find(ExternalLink).props().href).toContain('http://www.example.com');
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

    const wrapper = shallow(<RouteLocation obj={route} />);
    expect(wrapper.find(ExternalLink).exists()).toBe(true);
    expect(wrapper.find(ExternalLink).props().href).toContain('\\mypath');
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

    const wrapper = shallow(<RouteLocation obj={route} />);
    expect(wrapper.find(ExternalLink).exists()).toBe(false);
    expect(wrapper.find('div').text()).toEqual('*.example.com');
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

    const wrapper = shallow(<RouteLocation obj={route} />);
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('div').text()).toEqual('www.example.com');
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

    const wrapper = mount(<RouteStatus obj={route} />);
    const statusComponent = wrapper.find('SuccessStatus');
    expect(statusComponent.exists()).toBeTruthy();
    expect(statusComponent.prop('title')).toEqual('Accepted');
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

    const wrapper = mount(<RouteStatus obj={route} />);
    const statusComponent = wrapper.find('ErrorStatus');
    expect(statusComponent.exists()).toBeTruthy();
    expect(statusComponent.prop('title')).toEqual('Rejected');
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

    const wrapper = mount(<RouteStatus obj={route} />);
    const statusComponent = wrapper.find('StatusIconAndText');
    const icon = wrapper.find('HourglassHalfIcon');
    expect(icon.exists()).toBeTruthy();
    expect(statusComponent.prop('title')).toEqual('Pending');
  });
});
