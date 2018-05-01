/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow } from 'enzyme';

import { RouteHostname } from '../../public/components/routes';
import { K8sResourceKind } from '../../public/module/k8s';

describe('RouteHostname', () => {
  it('renders a https hostname link when TLS Settings', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      },
      'spec': {
        'host': 'www.secure-route.com',
        'tls': {
          'termination': 'edge'
        },
        'wildcardPolicy': 'None'
      },
      'status': {
        'ingress': [
          {
            'host': 'www.secure-route.com',
            'conditions': [
              {
                'type': 'Admitted',
                'status': 'True',
                'lastTransitionTime': '2018-04-30T16:55:48Z'
              }
            ]
          }
        ]
      }
    };

    const wrapper = shallow(<RouteHostname obj={route} />);
    expect(wrapper.find('a').exists()).toBe(true);
    expect(wrapper.find('a').props().href).toContain('https:');
  });

  it('renders a http hostname link when no TLS Settings', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      },
      'spec': {
        'host': 'www.secure-route.com',
        'wildcardPolicy': 'None'
      },
      'status': {
        'ingress': [
          {
            'host': 'www.secure-route.com',
            'conditions': [
              {
                'type': 'Admitted',
                'status': 'True',
                'lastTransitionTime': '2018-04-30T16:55:48Z'
              }
            ]
          }
        ]
      }
    };

    const wrapper = shallow(<RouteHostname obj={route} />);
    expect(wrapper.find('a').exists()).toBe(true);
    expect(wrapper.find('a').props().href).toContain('http:');
  });

  it('renders additional path in url', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      },
      'spec': {
        'host': 'www.secure-route.com',
        'path': '\\mypath',
        'wildcardPolicy': 'None'
      },
      'status': {
        'ingress': [
          {
            'host': 'www.secure-route.com',
            'conditions': [
              {
                'type': 'Admitted',
                'status': 'True',
                'lastTransitionTime': '2018-04-30T16:55:48Z'
              }
            ]
          }
        ]
      }
    };

    const wrapper = shallow(<RouteHostname obj={route} />);
    expect(wrapper.find('a').exists()).toBe(true);
    expect(wrapper.find('a').props().href).toContain('\\mypath');
  });

  it('renders Subdomain', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      },
      'spec': {
        'host': 'www.secure-route.com',
        'wildcardPolicy': 'Subdomain'
      },
      'status': {
        'ingress': [
          {
            'host': 'www.secure-route.com',
            'conditions': [
              {
                'type': 'Admitted',
                'status': 'True',
                'lastTransitionTime': '2018-04-30T16:55:48Z'
              }
            ]
          }
        ]
      }
    };

    const wrapper = shallow(<RouteHostname obj={route} />);
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('div').text()).toEqual('*.secure-route.com');
  });

  it('renders non-admitted label', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      },
      'spec': {
        'host': 'www.secure-route.com',
        'wildcardPolicy': 'None'
      },
      'status': {
        'ingress': [
          {
            'host': 'www.secure-route.com',
            'conditions': [
              {
                'type': 'Admitted',
                'status': 'False',
                'lastTransitionTime': '2018-04-30T16:55:48Z'
              }
            ]
          }
        ]
      }
    };

    const wrapper = shallow(<RouteHostname obj={route} />);
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('div').text()).toEqual('www.secure-route.com');
  });
});
