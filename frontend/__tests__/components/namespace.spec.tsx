import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { PullSecret } from '../../public/components/namespace';
import * as k8s from '../../public/module/k8s';
import { LoadingInline } from '../../public/components/utils';
import { testNamespace } from '../../__mocks__/k8sResourcesMocks';
import { ServiceAccountModel } from '../../public/models';

describe(PullSecret.displayName, () => {
  let wrapper: ReactWrapper;

  it('renders link to open modal once pull secrets are loaded', (done) => {
    new Promise((resolve) =>
      jest.spyOn(k8s, 'k8sGet').mockImplementation((...args) => {
        resolve(args);
        return Promise.resolve({ items: [] });
      }),
    )
      .then(([model, name, namespace, options]) => {
        expect(model).toEqual(ServiceAccountModel);
        expect(name).toBe('default');
        expect(namespace).toEqual(testNamespace.metadata.name);

        expect(options).toEqual({});
      })
      .then(() => {
        wrapper.update();
        expect(wrapper.find('button').exists()).toBe(true);
        done();
      });

    wrapper = mount(<PullSecret namespace={testNamespace} />);
  });

  it('does not render link if still loading', () => {
    jest.spyOn(k8s, 'k8sGet').mockReturnValue(Promise.resolve({ items: [] }));
    wrapper = mount(<PullSecret namespace={testNamespace} />);

    expect(wrapper.find(LoadingInline).exists()).toBe(true);
  });
});
