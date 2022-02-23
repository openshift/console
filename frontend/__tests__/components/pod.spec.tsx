import * as React from 'react';
import { Provider } from 'react-redux';
import { shallow, ShallowWrapper, mount, ReactWrapper } from 'enzyme';
import store from '@console/internal/redux';

import {
  ContainerRow,
  PodDetailsList,
  PodsDetailsPage,
  PodStatus,
  PodStatusProps,
} from '../../public/components/pod';
import { DetailsPage } from '../../public/components/factory';

import {
  history,
  NodeLink,
  ResourceLink,
  RuntimeClass,
  RuntimeClassProps,
} from '@console/internal/components/utils';
import { ResourceLinkProps } from '@console/dynamic-plugin-sdk';
import { t } from '../../__mocks__/i18next';
import { Router } from 'react-router-dom';
import { PodKind } from '@console/internal/module/k8s';

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

describe(PodDetailsList.displayName, () => {
  let podDetailsList: ReactWrapper;

  const pod: PodKind = {
    metadata: {},
    status: {
      phase: 'Running' as const,
      podIP: '127.0.0.1',
    },
    spec: {
      nodeName: 'test-node',
      containers: [
        {
          name: 'container',
        },
      ],
      imagePullSecrets: [
        {
          name: 'image-pull-secret-1',
        },
        {
          name: 'image-pull-secret-2',
        },
        {
          name: 'image-pull-secret-3',
        },
      ],
      restartPolicy: 'Never' as const,
    },
  };

  beforeAll(() => {
    // Full mount needed, because links have to be rendered
    podDetailsList = mount(<PodDetailsList pod={pod} />, {
      wrappingComponent: ({ children }) => (
        <Router history={history}>
          <Provider store={store}>{children}</Provider>
        </Router>
      ),
    });
  });

  it('renders a `PodStatus` component with the pod passed as prop', () => {
    const podStatus = podDetailsList.find<PodStatusProps>(PodStatus);

    expect(podStatus.props().pod.status.phase).toEqual('Running');
  });

  it("renders a `DetailsItem` showing the restart policy 'Never'", () => {
    const detailsItemRestartPolicy = podDetailsList.find(`[label="${t(`public~Restart policy`)}"]`);
    expect(detailsItemRestartPolicy.render().text()).toContain('Never');
  });

  it('renders a `DetailsItem` showing the active deadline seconds as not configured', () => {
    const detailsItemActiveDeadlineSeconds = podDetailsList.find(
      `[label="${t(`public~Active deadline seconds`)}"]`,
    );

    expect(detailsItemActiveDeadlineSeconds.render().text()).toContain(t(`public~Not configured`));
  });

  it('renders a `DetailsItem` showing the active deadline seconds', () => {
    const podDetailsListWithActiveDeadlineSecondsSet = mount(
      <PodDetailsList pod={{ ...pod, spec: { ...pod.spec, activeDeadlineSeconds: 10 } }} />,
      {
        wrappingComponent: ({ children }) => (
          <Router history={history}>
            <Provider store={store}>{children}</Provider>
          </Router>
        ),
      },
    );

    const detailsItemActiveDeadlineSeconds = podDetailsListWithActiveDeadlineSecondsSet.find(
      `[label="${t(`public~Active deadline seconds`)}"]`,
    );

    expect(detailsItemActiveDeadlineSeconds.render().text()).toContain(
      t(`public~{{count}} second`, { count: pod.spec.activeDeadlineSeconds }),
    );
  });

  it('renders a `DetailsItem` showing the Pod IP', () => {
    const detailsItemPodIP = podDetailsList.find(`[label="${t(`public~Pod IP`)}"]`);

    expect(detailsItemPodIP.render().text()).toContain('127.0.0.1');
  });

  it('renders a `DetailsItem` containing a `NodeLink` with the nodeName of the pod', () => {
    const detailsItemNodeLink = podDetailsList.find(`[label="${t(`public~Node`)}"]`).find(NodeLink);

    expect(detailsItemNodeLink.props().name).toEqual('test-node');
  });

  it('renders a `DetailsItem` component with three `ResourceLink` components of secret kind', () => {
    const detailsItemImagePullSecrets = podDetailsList.find(
      `[label="${t(`public~Image pull secret`)}"]`,
    );

    detailsItemImagePullSecrets.find<ResourceLinkProps>(ResourceLink).forEach((link, idx) => {
      expect(link.props().kind).toBe('Secret');
      expect(link.props().name).toBe(`image-pull-secret-${idx + 1}`);
    });
  });

  it('renders a `RuntimeClass`', () => {
    const runtimeClass = podDetailsList.find<RuntimeClassProps>(RuntimeClass);

    expect(runtimeClass.exists()).toBe(true);
  });
});

describe(ContainerRow.displayName, () => {
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
