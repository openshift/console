import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import {
  ResourceLink,
  ExternalLink,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { usePodsWatcher } from '@console/shared';
import {
  ServiceModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventingIMCModel,
  EventSourceContainerModel,
  EventSourceSinkBindingModel,
} from '../../../models';
import { getEventSourceResponse } from '../../../topology/__tests__/topology-knative-test-data';
import EventSourceOwnedList from '../EventSourceOwnedList';
import EventSourceResources from '../EventSourceResources';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

const current = {
  obj: {
    metadata: {
      name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621-5898f657c4',
      uid: '724ec872-ec82-4362-a933-d7a6e54ccfd8',
      namespace: 'testproject1',
      ownerReferences: [
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621',
          uid: 'efe9d39b-e16c-4f05-a82f-0ae1a80e20de',
        },
      ],
    },
  },
  revision: 1,
  alerts: {},
  pods: [
    {
      metadata: {
        name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621-58wpf6b',
        uid: 'b893336d-fe16-4fb5-ba29-cb2353ca0301',
        namespace: 'testproject1',
      },
      status: {
        phase: 'Running',
      },
    },
  ],
};

const fullPodData = {
  obj: {
    metadata: {
      name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621-5898f657c4',
      uid: '724ec872-ec82-4362-a933-d7a6e54ccfd8',
      namespace: 'testproject1',
      ownerReferences: [
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621',
          uid: 'efe9d39b-e16c-4f05-a82f-0ae1a80e20de',
        },
      ],
    },
  },
  current,
  previous: null,
  pods: [
    {
      metadata: {
        name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621-58wpf6b',
        uid: 'b893336d-fe16-4fb5-ba29-cb2353ca0301',
        namespace: 'testproject1',
      },
      status: {
        phase: 'Running',
      },
    },
  ],
  isRollingOut: false,
};

const noPodData = {
  obj: {
    metadata: {
      name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621-5898f657c4',
      uid: '724ec872-ec82-4362-a933-d7a6e54ccfd8',
      namespace: 'testproject1',
      ownerReferences: [
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: 'apiserversource-es-1-3f120723-370a-4a08-9eb6-791a7bc90621',
          uid: 'efe9d39b-e16c-4f05-a82f-0ae1a80e20de',
        },
      ],
    },
  },
  current: null,
  previous: null,
  pods: [],
  isRollingOut: false,
};

jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    usePodsWatcher: jest.fn(),
  };
});

const i18nNS = 'knative-plugin';

describe('EventSinkServicesOverviewList', () => {
  let podData;
  beforeEach(() => {
    podData = fullPodData;
    (usePodsWatcher as jest.Mock).mockImplementation(() => {
      return { loaded: true, loadError: '', podData };
    });
  });

  it('should show error info if no sink present or sink,kind is incorrect', () => {
    const mockData = _.omit(_.cloneDeep(getEventSourceResponse(EventSourceCamelModel).data[0]), [
      'spec',
      'status',
    ]);
    const wrapper = shallow(<EventSourceResources obj={mockData} />);
    expect(wrapper.find('span').text()).toBe(`${i18nNS}~No sink found for this resource.`);
  });

  it('should have ResourceLink with proper kind for sink to knSvc', () => {
    podData = noPodData;
    const wrapper = shallow(
      <EventSourceResources obj={getEventSourceResponse(EventSourceApiServerModel).data[0]} />,
    );
    const findResourceLink = wrapper.find(ResourceLink);
    expect(findResourceLink).toHaveLength(1);
    expect(findResourceLink.at(0).props().kind).toEqual(referenceForModel(ServiceModel));
  });

  it('should have ResourceLink with proper kind for sink to channel', () => {
    const sinkData = {
      sink: {
        apiVersion: `${EventingIMCModel.apiGroup}/${EventingIMCModel.apiVersion}`,
        kind: EventingIMCModel.kind,
        name: 'testchannel',
      },
    };
    const sinkChannelData = {
      ...getEventSourceResponse(EventSourceApiServerModel).data[0],
      ...{ spec: sinkData },
    };
    podData = noPodData;
    const wrapper = shallow(<EventSourceResources obj={sinkChannelData} />);
    const findResourceLink = wrapper.find(ResourceLink);
    expect(findResourceLink).toHaveLength(1);
    expect(findResourceLink.at(0).props().kind).toEqual(referenceForModel(EventingIMCModel));
  });

  it('should have only external link and not ResourceLink for sink to uri', () => {
    const mockData = {
      ...getEventSourceResponse(EventSourceCamelModel).data[0],
      spec: {
        uri: 'http://overlayimage.testproject3.svc.cluster.local',
      },
    };
    podData = noPodData;
    const wrapper = shallow(<EventSourceResources obj={mockData} />);
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
    expect(wrapper.find(ResourceLink)).toHaveLength(0);
  });

  it('should have ExternalLink when sinkUri is present', () => {
    const wrapper = shallow(
      <EventSourceResources obj={getEventSourceResponse(EventSourceApiServerModel).data[0]} />,
    );
    expect(wrapper.find(ExternalLink)).toHaveLength(1);
  });

  it('should not have ExternalLink when no sinkUri is present', () => {
    const mockEventSourceDataNoURI = _.omit(
      getEventSourceResponse(EventSourceApiServerModel).data[0],
      'status',
    );
    const wrapper = shallow(<EventSourceResources obj={mockEventSourceDataNoURI} />);
    expect(wrapper.find(ExternalLink)).toHaveLength(0);
  });

  it('should show Deployment if present', () => {
    const wrapper = shallow(
      <EventSourceResources obj={getEventSourceResponse(EventSourceApiServerModel).data[0]} />,
    );
    const findResourceLink = wrapper.find(ResourceLink);
    const findSidebarSectionHeading = wrapper.find(SidebarSectionHeading);
    expect(findSidebarSectionHeading).toHaveLength(2);
    expect(findResourceLink).toHaveLength(2);
    expect(findResourceLink.at(1).props().kind).toEqual('Deployment');
    expect(findSidebarSectionHeading.at(1).props().text).toEqual('knative-plugin~Deployment');
  });

  it('should show pods if present', () => {
    const wrapper = shallow(
      <EventSourceResources obj={getEventSourceResponse(EventSourceApiServerModel).data[0]} />,
    );
    expect(wrapper.find(PodsOverview)).toHaveLength(1);
    expect(wrapper.find(PodsOverview).props().allPodsLink).toEqual(
      '/search/ns/testproject3?kind=Pod&q=sources.knative.dev%2FapiServerSource%3Doverlayimage',
    );
  });

  it('should not show owned source if not present', () => {
    podData = noPodData;
    const wrapper = shallow(
      <EventSourceResources obj={getEventSourceResponse(EventSourceApiServerModel).data[0]} />,
    );
    expect(wrapper.find(EventSourceOwnedList)).toHaveLength(0);
  });

  it('should show owned source if present', () => {
    const sourceData = getEventSourceResponse(EventSourceSinkBindingModel).data[0];
    const ownSourceData: K8sResourceKind[] = [
      {
        ...sourceData,
        metadata: {
          name: 'overlayimage-sbs',
          namespace: 'testproject3',
          uid: '1317f615-9636-11e9-b134-06a61d886b689_2',
          ownerReferences: [
            {
              apiVersion: 'sources.knative.dev/v1beta1',
              blockOwnerDeletion: true,
              controller: true,
              kind: 'ContainerSource',
              name: 'overlayimage',
              uid: '1317f615-9636-11e9-b134-06a61d886b689_1',
            },
          ],
        },
      },
    ];
    const wrapper = shallow(
      <EventSourceResources
        obj={getEventSourceResponse(EventSourceContainerModel).data[0]}
        ownedSources={ownSourceData}
      />,
    );
    const findOwnedSourcesList = wrapper.find(EventSourceOwnedList);
    expect(findOwnedSourcesList).toHaveLength(1);
    expect(findOwnedSourcesList.at(0).props().source.kind).toEqual(
      EventSourceSinkBindingModel.kind,
    );
  });
});
