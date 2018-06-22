/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow } from 'enzyme';

import { RouteLocation, RouteStatus } from '../../public/components/routes';
import { K8sResourceKind } from '../../public/module/k8s';

describe(RouteLocation.displayName, () => {
  it('renders a https link when TLS Settings', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      },
      'spec': {
        'host': 'www.example.com',
        'tls': {
          'termination': 'edge'
        },
        'wildcardPolicy': 'None'
      },
      'status': {
        'ingress': [
          {
            'host': 'www.example.com',
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

    const wrapper = shallow(<RouteLocation obj={route} />);
    expect(wrapper.find('a').exists()).toBe(true);
    expect(wrapper.find('a').props().href).toContain('https:');
  });

  it('renders a http link when no TLS Settings', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      },
      'spec': {
        'host': 'www.example.com',
        'wildcardPolicy': 'None'
      },
      'status': {
        'ingress': [
          {
            'host': 'www.example.com',
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

    const wrapper = shallow(<RouteLocation obj={route} />);
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
        'host': 'www.example.com',
        'path': '\\mypath',
        'wildcardPolicy': 'None'
      },
      'status': {
        'ingress': [
          {
            'host': 'www.example.com',
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

    const wrapper = shallow(<RouteLocation obj={route} />);
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
        'host': 'www.example.com',
        'wildcardPolicy': 'Subdomain'
      },
      'status': {
        'ingress': [
          {
            'host': 'www.example.com',
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

    const wrapper = shallow(<RouteLocation obj={route} />);
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('div').text()).toEqual('*.example.com');
  });

  it('renders non-admitted label', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      },
      'spec': {
        'host': 'www.example.com',
        'wildcardPolicy': 'None'
      },
      'status': {
        'ingress': [
          {
            'host': 'www.example.com',
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

    const wrapper = shallow(<RouteLocation obj={route} />);
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('div').text()).toEqual('www.example.com');
  });
});


describe(RouteStatus.displayName, () => {
  it('renders Accepted status', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      },
      'status': {
        'ingress': [
          {
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

    const wrapper = shallow(<RouteStatus obj={route} />);
    expect(wrapper.find('.fa-check').exists()).toBe(true);
    expect(wrapper.text()).toEqual('Accepted');
  });

  it('renders Rejected status', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      },
      'status': {
        'ingress': [
          {
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

    const wrapper = shallow(<RouteStatus obj={route} />);
    expect(wrapper.find('.fa-times-circle').exists()).toBe(true);
    expect(wrapper.text()).toEqual('Rejected');
  });

  it('renders Pending status', () => {
    const route: K8sResourceKind = {
      'apiVersion': 'v1',
      'kind': 'Route',
      'metadata': {
        name: 'example',
      }
    };

    const wrapper = shallow(<RouteStatus obj={route} />);
    expect(wrapper.find('.fa-hourglass-half').exists()).toBe(true);
    expect(wrapper.text()).toEqual('Pending');
  });
});
