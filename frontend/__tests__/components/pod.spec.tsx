import * as React from 'react';
import { Provider } from 'react-redux';
import { shallow, ShallowWrapper, mount, ReactWrapper } from 'enzyme';
import store from '@console/internal/redux';

import { ContainerRow, PodsDetailsPage } from '../../public/components/pod';
import { DetailsPage } from '../../public/components/factory';

describe(PodsDetailsPage.displayName, () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    wrapper = mount(
      <PodsDetailsPage
        match={{
          url: '/k8s/ns/default/pods/example',
          path: '/k8s/ns/:ns/:plural/:name',
          isExact: true,
          params: {},
        }}
        kind="Pod"
      />,
      {
        wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );
  });

  it('renders `DetailsPage` with correct props', () => {
    expect(wrapper.find(DetailsPage).exists()).toBe(true);
  });
});

describe('ContainerRow', () => {
  let startTime;
  let finishTime;
  let pod;
  let container;
  let wrapper: ShallowWrapper;
  beforeAll(() => {
    startTime = Date.now();
    finishTime = Date.now() + 1;
    pod = {
      status: {
        conditions: [],
        containerStatuses: [
          {
            name: 'hello-openshift',
            state: {
              running: {
                startedAt: { startTime },
                finishedAt: { finishTime },
              },
            },
            restartCount: 10,
          },
        ],
      },
    };
    container = {
      name: 'hello-openshift',
      image: 'aosqe/hello-openshift',
    };
    wrapper = shallow(<ContainerRow pod={pod} container={container} />);
  });

  it('renders the container link', () => {
    expect(
      wrapper
        .find('ContainerLink')
        .find({ name: 'hello-openshift' })
        .exists(),
    ).toBe(true);
  });

  it('renders the container image', () => {
    expect(wrapper.childAt(1).text()).toContain('aosqe/hello-openshift');
  });

  it('renders the container state', () => {
    expect(
      wrapper
        .childAt(2)
        .find({ status: 'Running' })
        .exists(),
    ).toBe(true);
  });

  it('renders the container restart times', () => {
    expect(wrapper.childAt(3).text()).toBe('10');
  });

  it('renders the container started time', () => {
    expect(
      wrapper
        .childAt(4)
        .find({ timestamp: { startTime } })
        .exists(),
    ).toBe(true);
  });

  it('renders the container finished time', () => {
    expect(
      wrapper
        .childAt(5)
        .find({ timestamp: { finishTime } })
        .exists(),
    ).toBe(true);
  });

  it('renders the container exit code', () => {
    expect(wrapper.childAt(6).text()).toBe('-');
  });
});
