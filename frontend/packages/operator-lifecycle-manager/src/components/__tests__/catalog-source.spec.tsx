import { screen } from '@testing-library/react';
import * as _ from 'lodash';
import * as Router from 'react-router';
import { DetailsPage } from '@console/internal/components/factory';
import {
  useK8sWatchResource,
  useK8sWatchResources,
} from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testCatalogSource, testPackageManifest, dummyPackageManifest } from '../../../mocks';
import { DEFAULT_SOURCE_NAMESPACE } from '../../const';
import { CatalogSourceModel, PackageManifestModel } from '../../models';
import {
  CatalogSourceDetails,
  CatalogSourceDetailsPage,
  CreateSubscriptionYAML,
} from '../catalog-source';

jest.mock('@patternfly/react-topology', () => ({}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
  useK8sWatchResources: jest.fn(),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('@console/internal/components/factory', () => ({
  DetailsPage: jest.fn(() => null),
  Table: jest.fn(() => null),
  TableData: jest.fn(({ children }) => children),
  MultiListPage: jest.fn(() => null),
}));

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/internal/components/utils'),
  LoadingBox: jest.fn(() => 'Loading...'),
  ResourceSummary: jest.fn(() => 'ResourceSummary'),
  SectionHeading: jest.fn(({ text }) => text),
  DetailsItem: jest.fn(({ obj, path, children, label }) => {
    if (children) {
      return (
        <>
          {label && <span>{label}</span>}
          <span>{children}</span>
        </>
      );
    }
    if (path) {
      const value = path.split('.').reduce((acc, key) => acc?.[key], obj);
      if (value == null || value === '') {
        return null;
      }
      return (
        <>
          {label && <span>{label}</span>}
          <span>{value}</span>
        </>
      );
    }
    return null;
  }),
}));

jest.mock('@console/internal/components/create-yaml', () => ({
  CreateYAML: jest.fn(({ template }) => template),
}));

jest.mock('../operator-group', () => ({
  requireOperatorGroup: jest.fn((component) => component),
}));

jest.mock('@console/shared/src/components/error', () => ({
  ErrorBoundary: jest.fn(({ children }) => children),
  withFallback: jest.fn((successComponent) => (props) => successComponent(props)),
}));

jest.mock('../package-manifest', () => ({
  PackageManifestsPage: jest.fn(() => null),
}));

jest.mock('../registry-poll-interval-details', () => ({
  RegistryPollIntervalDetailItem: jest.fn(() => null),
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => children),
}));

jest.mock('@patternfly/react-core', () => ({
  ...jest.requireActual('@patternfly/react-core'),
  Grid: jest.fn(({ children }) => children),
  GridItem: jest.fn(({ children }) => children),
  DescriptionList: jest.fn(({ children }) => children),
}));

const mockDetailsPage = (DetailsPage as unknown) as jest.Mock;
const mockUseK8sWatchResource = useK8sWatchResource as jest.Mock;
const mockUseK8sWatchResources = useK8sWatchResources as jest.Mock;

describe('CatalogSourceDetails', () => {
  let obj;

  beforeEach(() => {
    obj = _.cloneDeep(testCatalogSource);
  });

  it('renders catalog source details with display name and publisher', () => {
    renderWithProviders(
      <CatalogSourceDetails obj={obj} packageManifests={[testPackageManifest]} />,
    );
    expect(screen.getByText(/CatalogSource details/i)).toBeVisible();
    expect(screen.getByText(obj.spec.displayName, { exact: false })).toBeVisible();
    expect(screen.getByText(obj.spec.publisher, { exact: false })).toBeVisible();
  });

  it('displays availability based on namespace', () => {
    const clusterWideSource = {
      ...obj,
      metadata: { ...obj.metadata, namespace: DEFAULT_SOURCE_NAMESPACE },
    };
    renderWithProviders(
      <CatalogSourceDetails obj={clusterWideSource} packageManifests={[testPackageManifest]} />,
    );
    expect(screen.getByText('Cluster wide')).toBeVisible();
  });

  it('displays image endpoint when spec.image is set', () => {
    const sourceWithImage = {
      ...obj,
      spec: { ...obj.spec, image: 'quay.io/my-registry/my-catalog:latest' },
    };
    renderWithProviders(<CatalogSourceDetails obj={sourceWithImage} packageManifests={[]} />);
    expect(screen.getByText('quay.io/my-registry/my-catalog:latest')).toBeVisible();
  });
});

describe('CatalogSourceDetailsPage', () => {
  beforeEach(() => {
    mockUseK8sWatchResource.mockReturnValue([dummyPackageManifest, true, null]);
    mockDetailsPage.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('configures DetailsPage with route, CatalogSource kind, Operators tab data, and three tabs', () => {
    const params = { ns: 'my-namespace', name: 'my-catalog' };
    jest.spyOn(Router, 'useParams').mockReturnValue(params);

    renderWithProviders(<CatalogSourceDetailsPage />);

    expect(mockDetailsPage).toHaveBeenCalledTimes(1);
    const [props] = mockDetailsPage.mock.calls[0];

    expect(props.namespace).toBe(params.ns);
    expect(props.name).toBe(params.name);
    expect(props.kind).toBe(referenceForModel(CatalogSourceModel));

    expect(props.pages.map((p) => p.nameKey)).toEqual([
      'public~Details',
      'public~YAML',
      'olm~Operators',
    ]);

    expect(props.resources).toHaveLength(1);
    expect(props.resources[0]).toMatchObject({
      kind: referenceForModel(PackageManifestModel),
      isList: true,
      prop: 'packageManifests',
      namespace: params.ns,
    });
  });
});

describe('CreateSubscriptionYAML', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'default',
      pkgName: testPackageManifest.metadata.name,
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: window.location.pathname,
      search: `?pkg=${testPackageManifest.metadata.name}&catalog=ocs&catalogNamespace=default`,
      state: null,
      hash: '',
      key: 'default',
      unstable_mask: undefined,
    });
    mockUseK8sWatchResources.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays loading indicator when package manifest is not yet loaded', () => {
    mockUseK8sWatchResources.mockReturnValue({
      packageManifest: { loaded: false, data: undefined, loadError: null },
      operatorGroup: { loaded: false, data: undefined, loadError: null },
    });

    renderWithProviders(<CreateSubscriptionYAML />);
    expect(screen.getByText('Loading...')).toBeVisible();
  });

  it('displays subscription YAML with package name, channel, and catalog info when loaded', () => {
    mockUseK8sWatchResources.mockReturnValue({
      packageManifest: { loaded: true, data: testPackageManifest, loadError: null },
      operatorGroup: { loaded: true, data: [], loadError: null },
    });

    renderWithProviders(<CreateSubscriptionYAML />);

    expect(screen.getByText(new RegExp(testPackageManifest.metadata.name))).toBeVisible();
    expect(screen.getByText(/channel:\s*alpha/)).toBeVisible();
    expect(screen.getByText(/source:\s*ocs/)).toBeVisible();
    expect(screen.getByText(/startingCSV:\s*testapp/)).toBeVisible();
  });

  it('uses first channel when no default channel is specified', () => {
    const packageWithoutDefault = {
      ...testPackageManifest,
      status: {
        ...testPackageManifest.status,
        defaultChannel: undefined,
        channels: [{ name: 'beta', currentCSV: 'testapp-beta' }],
      },
    };

    mockUseK8sWatchResources.mockReturnValue({
      packageManifest: { loaded: true, data: packageWithoutDefault, loadError: null },
      operatorGroup: { loaded: true, data: [], loadError: null },
    });

    renderWithProviders(<CreateSubscriptionYAML />);
    expect(screen.getByText(/channel:\s*beta/)).toBeVisible();
  });
});
