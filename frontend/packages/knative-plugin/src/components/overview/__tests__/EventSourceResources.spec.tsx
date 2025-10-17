import { render, screen } from '@testing-library/react';
import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  EVENTING_IMC_KIND,
  EVENT_SOURCE_API_SERVER_KIND,
  EVENT_SOURCE_CAMEL_KIND,
  KNATIVE_EVENT_MESSAGE_APIGROUP,
  KNATIVE_EVENT_SOURCE_APIGROUP,
} from '../../../const';
import { ServiceModel } from '../../../models';
import { getEventSourceResponse } from '../../../topology/__tests__/topology-knative-test-data';
import { EventSourceTarget } from '../EventSourceResources';

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: 'ResourceLink',
  SidebarSectionHeading: 'SidebarSectionHeading',
}));

jest.mock('@console/shared/src/components/links/ExternalLink', () => ({
  ExternalLink: 'ExternalLink',
}));

jest.mock('../EventSourceOwnedList', () => ({
  __esModule: true,
  default: 'EventSourceOwnedList',
}));

jest.mock('@patternfly/react-core', () => ({
  List: 'List',
  ListItem: 'ListItem',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@console/shared', () => {
  const ActualShared = jest.requireActual('@console/shared');
  return {
    ...ActualShared,
    usePodsWatcher: jest.fn(),
  };
});

describe('EventSinkServicesOverviewList', () => {
  it('should show error info if no sink present or sink,kind is incorrect', () => {
    const mockData = _.omit(
      _.cloneDeep(
        getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1alpha1', EVENT_SOURCE_CAMEL_KIND)
          .data[0],
      ),
      ['spec', 'status'],
    );
    render(<EventSourceTarget obj={mockData} />);
    expect(screen.getByText(/No sink found for this resource/)).toBeInTheDocument();
  });

  it('should have ResourceLink with proper kind for sink to knSvc', () => {
    const { container } = render(
      <EventSourceTarget
        obj={
          getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1', EVENT_SOURCE_API_SERVER_KIND)
            .data[0]
        }
      />,
    );
    const resourceLink = container.querySelector('ResourceLink');
    expect(resourceLink).toBeInTheDocument();
    expect(resourceLink).toHaveAttribute('kind', referenceForModel(ServiceModel));
  });

  it('should have ResourceLink with proper kind for sink to channel', () => {
    const sinkData = {
      sink: {
        apiVersion: `${KNATIVE_EVENT_MESSAGE_APIGROUP}/v1`,
        kind: EVENTING_IMC_KIND,
        name: 'testchannel',
      },
    };
    const sinkChannelData = {
      ...getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1', EVENT_SOURCE_API_SERVER_KIND)
        .data[0],
      ...{ spec: sinkData },
    };
    const { container } = render(<EventSourceTarget obj={sinkChannelData} />);
    const resourceLink = container.querySelector('ResourceLink');
    expect(resourceLink).toBeInTheDocument();
    expect(resourceLink).toHaveAttribute('kind', 'messaging.knative.dev~v1~InMemoryChannel');
  });

  it('should have only external link and not ResourceLink for sink to uri', () => {
    const mockData = {
      ...getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1alpha1', EVENT_SOURCE_CAMEL_KIND)
        .data[0],
      spec: {
        uri: 'http://overlayimage.testproject3.svc.cluster.local',
      },
    };
    const { container } = render(<EventSourceTarget obj={mockData} />);
    expect(container.querySelector('ExternalLink')).toBeInTheDocument();
    expect(container.querySelector('ResourceLink')).not.toBeInTheDocument();
  });

  it('should have ExternalLink when sinkUri is present', () => {
    const { container } = render(
      <EventSourceTarget
        obj={
          getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1', EVENT_SOURCE_API_SERVER_KIND)
            .data[0]
        }
      />,
    );
    expect(container.querySelector('ExternalLink')).toBeInTheDocument();
  });

  it('should not have ExternalLink when no sinkUri is present', () => {
    const mockEventSourceDataNoURI = _.omit(
      getEventSourceResponse(KNATIVE_EVENT_SOURCE_APIGROUP, 'v1', EVENT_SOURCE_API_SERVER_KIND)
        .data[0],
      'status',
    );
    const { container } = render(<EventSourceTarget obj={mockEventSourceDataNoURI} />);
    expect(container.querySelector('ExternalLink')).not.toBeInTheDocument();
  });
});
