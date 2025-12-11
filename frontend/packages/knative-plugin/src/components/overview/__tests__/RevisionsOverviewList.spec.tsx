import { render, screen, fireEvent } from '@testing-library/react';
import * as _ from 'lodash';
import { useAccessReview } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { RevisionModel } from '../../../models';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import {
  mockRevisions,
  mockTrafficData,
} from '../../../utils/__mocks__/traffic-splitting-utils-mock';
import * as TrafficSplittingController from '../../traffic-splitting/TrafficSplittingController';
import RevisionsOverviewList from '../RevisionsOverviewList';

// Mock Kebab factory at the very top to avoid hoisting issues
jest.mock('@console/internal/components/utils', () => ({
  SidebarSectionHeading: 'SidebarSectionHeading',
  useAccessReview: jest.fn(),
  withHandlePromise: () => (Component: React.ComponentType) => Component,
  Kebab: {
    factory: {
      common: [],
    },
  },
}));

jest.mock('../../traffic-splitting/TrafficSplittingController', () => ({
  ...jest.requireActual('../../traffic-splitting/TrafficSplittingController'),
  useTrafficSplittingModalLauncher: jest.fn(),
}));

jest.mock('@patternfly/react-core', () => ({
  Button: 'Button',
  List: 'List',
}));

jest.mock('react-router-dom-v5-compat', () => ({
  Link: 'Link',
}));

jest.mock('../RevisionsOverviewListItem', () => ({
  __esModule: true,
  default: 'RevisionsOverviewListItem',
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

const useTrafficSplittingModalLauncherMock = TrafficSplittingController.useTrafficSplittingModalLauncher as jest.Mock;

describe('RevisionsOverviewList', () => {
  // Get the mocked function using the imported function
  const mockUseAccessReview = useAccessReview as any;

  beforeEach(() => {
    mockUseAccessReview.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have title Revisions', () => {
    const { container } = render(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const sidebarHeading = container.querySelector('SidebarSectionHeading');
    expect(sidebarHeading).toBeInTheDocument();
    expect(sidebarHeading).toHaveAttribute('text', expect.stringContaining('Revisions'));
  });

  it('should show info if no Revisions present, link for all revisions should not be shown and traffic split button should be disabled', () => {
    const { container } = render(
      <RevisionsOverviewList revisions={[]} service={MockKnativeResources.revisions.data[0]} />,
    );
    expect(container.querySelector('Link')).not.toBeInTheDocument();
    expect(screen.getByText(/No Revisions found for this resource/)).toBeInTheDocument();
    const button = container.querySelector('Button');
    expect(button).toBeInTheDocument();
  });

  it('should show Resource Link if number of revisions is more than MAX_REVISIONS', () => {
    const { container } = render(
      <RevisionsOverviewList
        revisions={mockRevisions}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const link = container.querySelector('Link');
    expect(link).toBeInTheDocument();
    const url = `/search/ns/${MockKnativeResources.ksservices.data[0].metadata?.namespace}`;
    const params = new URLSearchParams();
    params.append('kind', referenceForModel(RevisionModel));
    params.append(
      'q',
      `serving.knative.dev/service=${MockKnativeResources.ksservices.data[0].metadata?.name}`,
    );
    expect(link).toHaveAttribute('to', `${url}?${params.toString()}`);
    expect(link?.textContent).toContain('View all');
  });

  it('should not show Resource Link if number of revisions is less than MAX_REVISIONS', () => {
    const { container } = render(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    expect(container.querySelector('Link')).not.toBeInTheDocument();
  });

  it('should have button for traffic distribution and enabled', () => {
    const { container } = render(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const button = container.querySelector('Button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/Set traffic distribution/);
    // Check that button is NOT disabled (no isdisabled attribute)
    expect(button?.outerHTML).not.toContain('isdisabled');
  });

  it('should call setTrafficDistributionModal on click', () => {
    const trafficSplitModalLauncherMock = jest.fn();
    useTrafficSplittingModalLauncherMock.mockImplementation(() => trafficSplitModalLauncherMock);
    const { container } = render(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const button = container.querySelector('Button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(trafficSplitModalLauncherMock).toHaveBeenCalled();
  });

  it('should not show button for traffic distribution if access is not there', () => {
    mockUseAccessReview.mockReturnValue(false);
    const { container } = render(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(container.querySelector('Button')).not.toBeInTheDocument();
  });

  it('should render RevisionsOverviewListItem for revisions as many as MAX_REVISION if number of revisions receiving traffic is less than MAX_REVISION', () => {
    const { container } = render(
      <RevisionsOverviewList
        revisions={mockRevisions}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const listItems = container.querySelectorAll('RevisionsOverviewListItem');
    expect(listItems).toHaveLength(3);
  });

  it('should render RevisionsOverviewListItem for all revisions receiving traffic', () => {
    const serviceWithTraffic = _.set(
      _.cloneDeep(MockKnativeResources.ksservices.data[0]),
      'status.traffic',
      mockTrafficData,
    );
    const { container } = render(
      <RevisionsOverviewList revisions={mockRevisions} service={serviceWithTraffic} />,
    );
    const listItems = container.querySelectorAll('RevisionsOverviewListItem');
    expect(listItems).toHaveLength(4);
  });
});
