import type { ComponentType } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .knativeInternalUtilsStubs,
  useAccessReview: jest.fn(),
  withHandlePromise: () => (Component: ComponentType) => Component,
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
  Button: ({ children, isDisabled, onClick, ...rest }: any) => (
    <button
      type="button"
      data-test="mock-Button"
      disabled={!!isDisabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  ),
  List: ({ children, ...rest }: any) => (
    <div data-test="mock-List" {...rest}>
      {children}
    </div>
  ),
}));

jest.mock('react-router', () => ({
  Link: ({ children, to, className, ...rest }: any) => {
    const href = typeof to === 'string' ? to : '#';
    return (
      <a data-test="mock-Link" href={href} className={className} {...rest}>
        {children}
      </a>
    );
  },
}));

jest.mock('../RevisionsOverviewListItem', () => ({
  __esModule: true,
  default: () => <div data-test="mock-RevisionsOverviewListItem" />,
}));

jest.mock('react-i18next');

const useTrafficSplittingModalLauncherMock = TrafficSplittingController.useTrafficSplittingModalLauncher as jest.Mock;

describe('RevisionsOverviewList', () => {
  const mockUseAccessReview = useAccessReview as any;

  beforeEach(() => {
    mockUseAccessReview.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have title Revisions', () => {
    render(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Revisions' })).toBeInTheDocument();
  });

  it('should show info if no Revisions present, link for all revisions should not be shown and traffic split button should be disabled', () => {
    render(
      <RevisionsOverviewList revisions={[]} service={MockKnativeResources.revisions.data[0]} />,
    );
    expect(screen.queryByTestId('mock-Link')).not.toBeInTheDocument();
    expect(screen.getByText(/No Revisions found for this resource/)).toBeInTheDocument();
    const button = screen.getByTestId('mock-Button');
    expect(button).toBeVisible();
    expect(button).toBeDisabled();
  });

  it('should show Resource Link if number of revisions is more than MAX_REVISIONS', () => {
    render(
      <RevisionsOverviewList
        revisions={mockRevisions}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const link = screen.getByTestId('mock-Link');
    expect(link).toBeVisible();
    const url = `/search/ns/${MockKnativeResources.ksservices.data[0].metadata?.namespace}`;
    const params = new URLSearchParams();
    params.append('kind', referenceForModel(RevisionModel));
    params.append(
      'q',
      `serving.knative.dev/service=${MockKnativeResources.ksservices.data[0].metadata?.name}`,
    );
    expect(link).toHaveAttribute('href', `${url}?${params.toString()}`);
    expect(link.textContent).toContain('View all');
  });

  it('should not show Resource Link if number of revisions is less than MAX_REVISIONS', () => {
    render(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    expect(screen.queryByTestId('mock-Link')).not.toBeInTheDocument();
  });

  it('should have button for traffic distribution and enabled', () => {
    render(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const button = screen.getByTestId('mock-Button');
    expect(button).toBeVisible();
    expect(button).toHaveTextContent(/Set traffic distribution/);
    expect(button).not.toBeDisabled();
  });

  it('should call setTrafficDistributionModal on click', async () => {
    const user = userEvent.setup();
    const trafficSplitModalLauncherMock = jest.fn();
    useTrafficSplittingModalLauncherMock.mockImplementation(() => trafficSplitModalLauncherMock);
    render(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    const button = screen.getByTestId('mock-Button');
    expect(button).toBeVisible();
    await user.click(button);
    expect(trafficSplitModalLauncherMock).toHaveBeenCalled();
  });

  it('should not show button for traffic distribution if access is not there', () => {
    mockUseAccessReview.mockReturnValue(false);
    render(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(screen.queryByTestId('mock-Button')).not.toBeInTheDocument();
  });

  it('should render RevisionsOverviewListItem for revisions as many as MAX_REVISION if number of revisions receiving traffic is less than MAX_REVISION', () => {
    render(
      <RevisionsOverviewList
        revisions={mockRevisions}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    expect(screen.getAllByTestId('mock-RevisionsOverviewListItem')).toHaveLength(3);
  });

  it('should render RevisionsOverviewListItem for all revisions receiving traffic', () => {
    const serviceWithTraffic = _.set(
      _.cloneDeep(MockKnativeResources.ksservices.data[0]),
      'status.traffic',
      mockTrafficData,
    );
    render(<RevisionsOverviewList revisions={mockRevisions} service={serviceWithTraffic} />);
    expect(screen.getAllByTestId('mock-RevisionsOverviewListItem')).toHaveLength(4);
  });
});
