import { screen } from '@testing-library/react';
import * as _ from 'lodash';
import * as Router from 'react-router';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { MultiListPage, DetailsPage } from '@console/internal/components/factory';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  testSubscription,
  testSubscriptions,
  testClusterServiceVersion,
  testPackageManifest,
} from '../../../mocks';
import {
  SubscriptionModel,
  ClusterServiceVersionModel,
  PackageManifestModel,
  OperatorGroupModel,
  InstallPlanModel,
} from '../../models';
import { SubscriptionState } from '../../types';
import {
  getSubscriptionDataViewRows,
  SubscriptionsList,
  SubscriptionsPage,
  SubscriptionDetails,
  SubscriptionDetailsPage,
  SubscriptionStatus,
} from '../subscription';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/internal/components/utils'),
  ResourceLink: jest.fn(() => null),
}));

jest.mock('@console/internal/components/factory', () => ({
  ...jest.requireActual('@console/internal/components/factory'),
  MultiListPage: jest.fn(() => null),
  DetailsPage: jest.fn(() => null),
}));

jest.mock('@console/internal/components/utils/details-page', () => ({
  ...jest.requireActual('@console/internal/components/utils/details-page'),
  ResourceSummary: jest.fn(() => null),
}));

jest.mock('@console/internal/components/conditions', () => ({
  Conditions: jest.fn(() => null),
}));

const mockResourceLink = ResourceLink as jest.Mock;
const mockMultiListPage = MultiListPage as jest.Mock;
const mockDetailsPage = DetailsPage as jest.Mock;

const renderRow = (obj, ids: string[]) => {
  const columns: ConsoleDataViewColumn<any>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getSubscriptionDataViewRows(
    [{ obj, activeColumnIDs: new Set(ids), rowData: undefined, index: 0 }],
    columns,
  );
  return renderWithProviders(
    <table>
      <tbody>
        <tr>
          {cells.map(({ id, cell }) => (
            <td key={id}>{cell}</td>
          ))}
        </tr>
      </tbody>
    </table>,
  );
};

describe('getSubscriptionDataViewRows', () => {
  const subscription = {
    ...testSubscription,
    status: { installedCSV: 'testapp.v1.0.0' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders subscription name and namespace resource links', () => {
    renderRow(subscription, ['name', 'namespace']);

    expect(mockResourceLink).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: referenceForModel(SubscriptionModel),
        name: subscription.metadata.name,
        namespace: subscription.metadata.namespace,
      }),
      expect.anything(),
    );

    expect(mockResourceLink).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'Namespace',
        name: subscription.metadata.namespace,
      }),
      expect.anything(),
    );
  });

  it('renders channel and approval strategy text', () => {
    renderRow(subscription, ['channel', 'approval']);

    expect(screen.getByText(subscription.spec.channel)).toBeVisible();
    expect(screen.getByText('Automatic')).toBeVisible();
  });

  it('falls back to the default channel name when none is set', () => {
    renderRow({ ...subscription, spec: { ...subscription.spec, channel: undefined } }, ['channel']);

    expect(screen.getByRole('cell', { name: 'default' })).toBeVisible();
  });

  it('preserves the requested column order and omits inactive columns', () => {
    renderRow(subscription, ['channel', 'approval']);

    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveTextContent(subscription.spec.channel);
    expect(cells[1]).toHaveTextContent('Automatic');
  });
});

describe('SubscriptionStatus', () => {
  it('renders "Upgrade available" when update is available', () => {
    const subscription = {
      ...testSubscription,
      status: { state: SubscriptionState.SubscriptionStateUpgradeAvailable },
    };

    renderWithProviders(<SubscriptionStatus subscription={subscription} />);

    expect(screen.getByText('Upgrade available')).toBeVisible();
  });

  it('renders "Unknown failure" when status is unknown', () => {
    const subscription = {
      ...testSubscription,
      status: {},
    };

    renderWithProviders(<SubscriptionStatus subscription={subscription} />);

    expect(screen.getByText('Unknown failure')).toBeVisible();
  });

  it('renders "Upgrading" when update is pending', () => {
    const subscription = {
      ...testSubscription,
      status: { state: SubscriptionState.SubscriptionStateUpgradePending },
    };

    renderWithProviders(<SubscriptionStatus subscription={subscription} />);

    expect(screen.getByText('Upgrading')).toBeVisible();
  });

  it('renders "Up to date" when subscription is at latest', () => {
    const subscription = {
      ...testSubscription,
      status: { state: SubscriptionState.SubscriptionStateAtLatest },
    };

    renderWithProviders(<SubscriptionStatus subscription={subscription} />);

    expect(screen.getByText('Up to date')).toBeVisible();
  });
});

describe('SubscriptionsList', () => {
  const originalIntersectionObserver = window.IntersectionObserver;

  beforeAll(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
      })),
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: originalIntersectionObserver,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the default and custom column headings', () => {
    renderWithProviders(
      <SubscriptionsList.WrappedComponent
        data={testSubscriptions}
        loaded
        {...{ [referenceForModel(ClusterServiceVersionModel)]: { data: [] } }}
        operatorGroup={null}
      />,
    );

    expect(screen.getByRole('columnheader', { name: /^Name\b/ })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: /^Namespace\b/ })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: /^Status\b/ })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: /^Update channel\b/ })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: /^Update approval\b/ })).toBeVisible();
  });

  it('renders the custom empty message instead of the table when no Subscriptions exist', () => {
    renderWithProviders(
      <SubscriptionsList.WrappedComponent
        data={[]}
        loaded
        {...{ [referenceForModel(ClusterServiceVersionModel)]: { data: [] } }}
        operatorGroup={null}
      />,
    );

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(screen.getByText('No Subscriptions found')).toBeVisible();
  });
});

describe('SubscriptionsPage', () => {
  it('renders MultiListPage with correct configuration', () => {
    renderWithProviders(<SubscriptionsPage namespace="default" />);

    expect(mockMultiListPage).toHaveBeenCalledTimes(1);
    const [multiListPageProps] = mockMultiListPage.mock.calls[0];

    expect(multiListPageProps.ListComponent).toEqual(SubscriptionsList);
    expect(multiListPageProps.title).toEqual('Subscriptions');
    expect(multiListPageProps.canCreate).toBe(true);
    expect(multiListPageProps.createProps).toEqual({
      to: '/catalog?catalogType=operator',
    });
    expect(multiListPageProps.createButtonText).toEqual('Create Subscription');
    expect(multiListPageProps.omitFilterToolbar).toBe(true);
    expect(multiListPageProps.resources).toEqual([
      {
        kind: referenceForModel(SubscriptionModel),
        namespace: 'default',
        namespaced: true,
        prop: 'subscription',
      },
      {
        kind: referenceForModel(OperatorGroupModel),
        namespace: 'default',
        namespaced: true,
        prop: 'operatorGroup',
      },
    ]);
  });
});

describe('SubscriptionDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders installed CSV resource link when installed', () => {
    const obj = _.cloneDeep(testSubscription);
    obj.status = { installedCSV: testClusterServiceVersion.metadata.name };

    renderWithProviders(
      <SubscriptionDetails
        obj={obj}
        packageManifests={[testPackageManifest]}
        subscriptions={testSubscriptions}
        clusterServiceVersions={[testClusterServiceVersion]}
      />,
    );

    expect(screen.getByText('Installed version')).toBeVisible();
    expect(mockResourceLink).toHaveBeenCalledWith(
      expect.objectContaining({
        title: obj.status.installedCSV,
        name: obj.status.installedCSV,
      }),
      expect.anything(),
    );
  });

  it('renders catalog source resource link', () => {
    renderWithProviders(
      <SubscriptionDetails
        obj={testSubscription}
        packageManifests={[testPackageManifest]}
        subscriptions={testSubscriptions}
      />,
    );

    expect(screen.getByText('CatalogSource')).toBeVisible();
    expect(mockResourceLink).toHaveBeenCalledWith(
      expect.objectContaining({
        name: testSubscription.spec.source,
      }),
      expect.anything(),
    );
  });
});

describe('SubscriptionDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'default', name: 'example-sub' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders DetailsPage with correct configuration', () => {
    renderWithProviders(<SubscriptionDetailsPage namespace="default" />);

    expect(mockDetailsPage).toHaveBeenCalledTimes(1);
    const [detailsPageProps] = mockDetailsPage.mock.calls[0];

    expect(detailsPageProps.kind).toEqual(referenceForModel(SubscriptionModel));
    expect(detailsPageProps.pages).toHaveLength(2);
    expect(detailsPageProps.customActionMenu).toBeDefined();
    expect(detailsPageProps.resources).toEqual([
      {
        kind: referenceForModel(PackageManifestModel),
        namespace: 'default',
        isList: true,
        prop: 'packageManifests',
      },
      {
        kind: referenceForModel(InstallPlanModel),
        isList: true,
        namespace: 'default',
        prop: 'installPlans',
      },
      {
        kind: referenceForModel(ClusterServiceVersionModel),
        isList: true,
        namespace: 'default',
        prop: 'clusterServiceVersions',
      },
      {
        kind: referenceForModel(SubscriptionModel),
        isList: true,
        namespace: 'default',
        prop: 'subscriptions',
      },
    ]);
  });
});
