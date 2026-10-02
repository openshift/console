import { screen } from '@testing-library/react';
import * as _ from 'lodash';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import operatorLogo from '@console/internal/imgs/operator.svg';
import {
  renderHookWithProviders,
  renderWithProviders,
} from '@console/shared/src/test-utils/unit-test-utils';
import {
  testClusterServiceVersion,
  testSubscription,
  testPackageManifest,
  testInstallPlan,
  testModel,
  testSubscriptions,
} from '../../../mocks';
import { ClusterServiceVersionPhase } from '../../types';
import { ClusterServiceVersionLogo } from '../cluster-service-version-logo';
import type { CRDCardProps, CSVSubscriptionProps } from '../clusterserviceversion';
import {
  getInstalledOperatorDataViewRows,
  CRDCard,
  CSVSubscription,
} from '../clusterserviceversion';
import { useClusterServiceVersionColumns } from '../useClusterServiceVersionColumns';

// Mock hooks
jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: () => [testModel],
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: () => true,
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
  useAccessReview: () => [true, false],
  useAccessReviewAllowed: () => true,
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(() => ({})),
  useLocation: jest.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(() => [[], true, null]),
}));

jest.mock('../../utils/useClusterServiceVersion', () => ({
  useClusterServiceVersion: jest.fn(() => [testClusterServiceVersion, true, null]),
}));

jest.mock('../../utils/useClusterServiceVersionPath', () => ({
  useClusterServiceVersionPath: jest.fn(() => '/test-path'),
}));

jest.mock('@console/shared/src/components/markdown/MarkdownView', () => ({
  MarkdownView: jest.fn(() => '[MARKDOWN_VIEW]'),
}));

jest.mock('@console/internal/components/conditions', () => ({
  Conditions: () => 'Conditions',
  ConditionTypes: { ClusterServiceVersion: 'ClusterServiceVersion' },
}));

jest.mock('@console/internal/components/events', () => ({
  ResourceEventStream: () => 'ResourceEventStream',
}));

jest.mock('../operand', () => ({
  ProvidedAPIsPage: () => 'ProvidedAPIsPage',
  ProvidedAPIPage: () => 'ProvidedAPIPage',
}));

jest.mock('../subscription', () => ({
  ...jest.requireActual('../subscription'),
  SubscriptionDetails: () => 'SubscriptionDetails',
  SubscriptionUpdates: () => 'SubscriptionUpdates',
  catalogSourceForSubscription: jest.fn(),
}));

const ALL_IDS = [
  'name',
  'namespace',
  'managedNamespaces',
  'status',
  'providedAPIs',
  'lastUpdated',
  'actions',
];

const renderInstalledOperatorRow = (obj, ids: string[] = ALL_IDS, rowData?: any) => {
  const columns: ConsoleDataViewColumn<any>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getInstalledOperatorDataViewRows(
    [
      {
        obj,
        activeColumnIDs: new Set(ids),
        rowData: rowData ?? { catalogSources: [], subscriptions: testSubscriptions },
        index: 0,
      },
    ],
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

describe('useClusterServiceVersionColumns', () => {
  it('includes the Namespace column only when all projects are selected', () => {
    const { result: allNs } = renderHookWithProviders(() =>
      useClusterServiceVersionColumns(true, false),
    );
    expect(allNs.current.columns.map(({ id }) => id)).toContain('namespace');

    const { result: singleNs } = renderHookWithProviders(() =>
      useClusterServiceVersionColumns(false, false),
    );
    expect(singleNs.current.columns.map(({ id }) => id)).not.toContain('namespace');
  });

  it('includes the lifecycle columns only when the lifecycle flag is on', () => {
    const { result: off } = renderHookWithProviders(() =>
      useClusterServiceVersionColumns(true, false),
    );
    expect(off.current.columns.map(({ id }) => id)).not.toContain('clusterCompatibility');

    const { result: on } = renderHookWithProviders(() =>
      useClusterServiceVersionColumns(true, true),
    );
    expect(on.current.columns.map(({ id }) => id)).toEqual([
      'name',
      'namespace',
      'managedNamespaces',
      'status',
      'providedAPIs',
      'clusterCompatibility',
      'supportPhase',
      'lastUpdated',
      'actions',
    ]);
  });
});

describe('getInstalledOperatorDataViewRows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.SERVER_FLAGS.copiedCSVsDisabled = false;
  });

  it('renders the CSV display name', () => {
    renderInstalledOperatorRow(testClusterServiceVersion);
    expect(screen.getByText(testClusterServiceVersion.spec.displayName)).toBeVisible();
  });

  it('renders LazyActionMenu with correct context and variant', () => {
    renderInstalledOperatorRow(testClusterServiceVersion);
    expect(screen.getByRole('button', { name: 'Actions' })).toBeVisible();
  });

  it('renders clickable link with CSV logo and display name', () => {
    renderInstalledOperatorRow(testClusterServiceVersion);
    const link = screen.getByRole('link', {
      name: new RegExp(testClusterServiceVersion.spec.displayName),
    });
    expect(link).toBeVisible();
  });

  it('renders managed namespace', () => {
    renderInstalledOperatorRow(testClusterServiceVersion, ['managedNamespaces']);
    expect(screen.getByRole('link', { name: 'openshift-operators' })).toBeVisible();
  });

  it('renders the operator namespace in its own column when all projects are selected', () => {
    renderInstalledOperatorRow(testClusterServiceVersion, ['namespace']);
    expect(screen.getByRole('link', { name: 'openshift-operators' })).toBeVisible();
  });

  it('renders last updated timestamp', () => {
    renderInstalledOperatorRow(testClusterServiceVersion);
    expect(screen.getByTestId('timestamp')).toBeVisible();
  });

  it('renders status showing Succeeded phase', () => {
    renderInstalledOperatorRow(testClusterServiceVersion);
    expect(screen.getByText(ClusterServiceVersionPhase.CSVPhaseSucceeded)).toBeVisible();
  });

  it('renders Deleting status when CSV has deletionTimestamp', () => {
    const deletingCSV = _.cloneDeepWith(testClusterServiceVersion, (v, k) =>
      k === 'metadata' ? { ...v, deletionTimestamp: Date.now() } : undefined,
    );
    renderInstalledOperatorRow(deletingCSV);
    expect(screen.getByText('Deleting')).toBeVisible();
  });

  it('renders links for each CRD provided by the Operator', () => {
    renderInstalledOperatorRow(testClusterServiceVersion);
    testClusterServiceVersion.spec.customresourcedefinitions.owned.forEach((desc) => {
      const crdLink = screen.getByRole('link', { name: new RegExp(desc.displayName || desc.kind) });
      expect(crdLink).toBeVisible();
    });
  });

  it('renders an orphan Subscription row with None placeholders', () => {
    renderInstalledOperatorRow(testSubscription, [
      'name',
      'managedNamespaces',
      'providedAPIs',
      'actions',
    ]);
    expect(screen.getAllByText('None')).toHaveLength(2);
    expect(
      screen.getByRole('link', { name: new RegExp(testSubscription.spec.name) }),
    ).toBeVisible();
  });

  it('preserves the requested column order and omits inactive columns', () => {
    renderInstalledOperatorRow(testClusterServiceVersion, ['managedNamespaces', 'name']);
    expect(screen.getAllByRole('cell')).toHaveLength(2);
  });
});

describe('ClusterServiceVersionLogo', () => {
  it('renders logo image from base64 encoded string', () => {
    const { provider, icon, displayName } = testClusterServiceVersion.spec;

    renderWithProviders(
      <ClusterServiceVersionLogo icon={icon[0]} displayName={displayName} provider={provider} />,
    );

    // Image has alt="" for decorative purposes, so it has role="presentation" not "img"
    const image = screen.getByRole('presentation');
    expect(image).toHaveAttribute('src', `data:${icon[0].mediatype};base64,${icon[0].base64data}`);
  });

  it('renders fallback image when icon is invalid', () => {
    const { provider, displayName } = testClusterServiceVersion.spec;

    renderWithProviders(
      <ClusterServiceVersionLogo icon={null} displayName={displayName} provider={provider} />,
    );

    // Image has alt="" for decorative purposes, so it has role="presentation" not "img"
    const image = screen.getByRole('presentation');
    expect(image).toHaveAttribute('src', operatorLogo);
  });

  it('renders CSV display name and provider name', () => {
    const { provider, icon, displayName } = testClusterServiceVersion.spec;

    renderWithProviders(
      <ClusterServiceVersionLogo icon={icon[0]} displayName={displayName} provider={provider} />,
    );

    expect(screen.getByText(displayName)).toBeVisible();
    expect(screen.getByText(new RegExp(provider.name))).toBeVisible();
  });
});

describe('CRDCard', () => {
  let crdCardProps: CRDCardProps;
  const crd = testClusterServiceVersion.spec.customresourcedefinitions.owned[0];

  beforeEach(() => {
    crdCardProps = {
      canCreate: false,
      crd,
      csv: testClusterServiceVersion,
    };
  });

  it('does not render create link when canCreate is false', () => {
    renderWithProviders(<CRDCard {...crdCardProps} canCreate={false} />);

    expect(screen.queryByRole('link', { name: 'Create instance' })).not.toBeInTheDocument();
  });
});

describe('CSVSubscription', () => {
  let csvSubscriptionProps: CSVSubscriptionProps;

  beforeEach(() => {
    csvSubscriptionProps = {
      obj: testClusterServiceVersion,
      customData: {
        subscriptions: testSubscriptions,
        subscription: undefined,
        subscriptionsLoaded: true,
      },
      packageManifests: [],
      installPlans: [],
    };
  });

  it('renders StatusBox with EmptyMsg when subscription does not exist', () => {
    renderWithProviders(<CSVSubscription {...csvSubscriptionProps} />);

    expect(screen.getByText('No Operator Subscription')).toBeVisible();
    expect(screen.getByText('This Operator will not receive updates.')).toBeVisible();
  });

  it('renders SubscriptionDetails when subscription exists', () => {
    const obj = _.set(_.cloneDeep(testClusterServiceVersion), 'metadata.annotations', {
      'olm.operatorNamespace': 'default',
    });
    const subscription = _.set(_.cloneDeep(testSubscription), 'status', {
      installedCSV: obj.metadata.name,
    });

    renderWithProviders(
      <CSVSubscription
        {...csvSubscriptionProps}
        obj={obj}
        customData={{
          subscription,
          subscriptions: [testSubscription, subscription],
          subscriptionsLoaded: true,
        }}
        packageManifests={[testPackageManifest]}
        installPlans={[testInstallPlan]}
      />,
    );
    expect(screen.queryByText('No Operator Subscription')).not.toBeInTheDocument();
  });

  it('passes matching PackageManifest when multiple exist with same name', () => {
    const obj = _.set(_.cloneDeep(testClusterServiceVersion), 'metadata.annotations', {
      'olm.operatorNamespace': 'default',
    });
    const subscription = _.set(_.cloneDeep(testSubscription), 'status', {
      installedCSV: obj.metadata.name,
    });
    const otherPkg = _.set(
      _.cloneDeep(testPackageManifest),
      'status.catalogSource',
      'other-source',
    );

    renderWithProviders(
      <CSVSubscription
        {...csvSubscriptionProps}
        obj={obj}
        packageManifests={[testPackageManifest, otherPkg]}
        installPlans={[testInstallPlan]}
        customData={{
          subscription,
          subscriptionsLoaded: true,
          subscriptions: [testSubscription, subscription],
        }}
      />,
    );
    expect(screen.queryByText('No Operator Subscription')).not.toBeInTheDocument();
  });
});
