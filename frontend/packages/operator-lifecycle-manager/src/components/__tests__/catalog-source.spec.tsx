import { cloneElement } from 'react';
import { screen } from '@testing-library/react';
import * as _ from 'lodash';
import * as Router from 'react-router-dom-v5-compat';
import { DetailsPage } from '@console/internal/components/factory';
import { Firehose } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testCatalogSource, testPackageManifest, dummyPackageManifest } from '../../../mocks';
import { CatalogSourceModel, PackageManifestModel } from '../../models';
import {
  CatalogSourceDetails,
  CatalogSourceDetailsPage,
  CreateSubscriptionYAML,
  CatalogSourceOperatorsPage,
} from '../catalog-source';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
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
  Firehose: jest.fn(({ children }) => {
    const props = { packageManifest: { loaded: false } };
    return typeof children === 'function' ? children(props) : children;
  }),
  LoadingBox: jest.fn(() => 'Loading...'),
  ResourceSummary: jest.fn(() => null),
  SectionHeading: jest.fn(() => null),
  DetailsItem: jest.fn(({ obj, path, children }) => {
    if (children) return children;
    if (path) {
      const value = path.split('.').reduce((acc, key) => acc?.[key], obj);
      return value || null;
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
const mockFirehose = (Firehose as unknown) as jest.Mock;
const mockUseK8sWatchResource = useK8sWatchResource as jest.Mock;

describe('CatalogSourceDetails', () => {
  let obj;

  beforeEach(() => {
    obj = _.cloneDeep(testCatalogSource);
  });

  it('displays catalog source name and publisher', () => {
    renderWithProviders(
      <CatalogSourceDetails obj={obj} packageManifests={[testPackageManifest]} />,
    );

    expect(screen.getByText(obj.spec.displayName, { exact: false })).toBeVisible();
    expect(screen.getByText(obj.spec.publisher, { exact: false })).toBeVisible();
  });
});

describe('CatalogSourceDetailsPage', () => {
  beforeEach(() => {
    mockUseK8sWatchResource.mockReturnValue([dummyPackageManifest, true, null]);
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'default', name: 'some-catalog' });
    mockDetailsPage.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders catalog source details page without errors', () => {
    expect(() => {
      renderWithProviders(<CatalogSourceDetailsPage />);
    }).not.toThrow();
  });

  // TODO: Refactor to test user behavior instead of implementation details
  it('configures DetailsPage with correct navigation and resources', () => {
    renderWithProviders(<CatalogSourceDetailsPage />);

    expect(mockDetailsPage).toHaveBeenCalledTimes(1);
    const [detailsPageProps] = mockDetailsPage.mock.calls[0];

    expect(detailsPageProps.kind).toEqual(referenceForModel(CatalogSourceModel));

    expect(detailsPageProps.pages).toHaveLength(3);
    expect(detailsPageProps.pages[0]).toMatchObject({
      nameKey: 'public~Details',
      component: CatalogSourceDetails,
    });
    expect(detailsPageProps.pages[1]).toMatchObject({
      nameKey: 'public~YAML',
    });
    expect(detailsPageProps.pages[2]).toMatchObject({
      nameKey: 'olm~Operators',
      component: CatalogSourceOperatorsPage,
    });

    expect(detailsPageProps.resources).toEqual([
      {
        kind: referenceForModel(PackageManifestModel),
        isList: true,
        prop: 'packageManifests',
        namespace: 'default',
      },
    ]);
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
    });
    mockFirehose.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays package name in the subscription YAML when loaded', () => {
    mockFirehose.mockImplementationOnce((firehoseProps) => {
      const childElement = firehoseProps.children;
      return cloneElement(childElement, {
        packageManifest: { loaded: true, data: testPackageManifest },
        operatorGroup: { loaded: true, data: [] },
      });
    });

    renderWithProviders(<CreateSubscriptionYAML />);

    expect(screen.getByText(new RegExp(testPackageManifest.metadata.name))).toBeVisible();
  });

  it('displays loading indicator when package manifest is not yet loaded', () => {
    mockFirehose.mockImplementationOnce((firehoseProps) => {
      const childElement = firehoseProps.children;
      return cloneElement(childElement, {
        packageManifest: { loaded: false },
        operatorGroup: { loaded: false },
      });
    });

    renderWithProviders(<CreateSubscriptionYAML />);

    expect(screen.getByText('Loading...')).toBeVisible();
  });

  it('displays subscription YAML with default channel information', () => {
    mockFirehose.mockImplementationOnce((firehoseProps) => {
      const childElement = firehoseProps.children;
      return cloneElement(childElement, {
        packageManifest: { loaded: true, data: testPackageManifest },
        operatorGroup: { loaded: true, data: [] },
      });
    });

    renderWithProviders(<CreateSubscriptionYAML />);

    expect(screen.getByText(/channel:\s*alpha/)).toBeInTheDocument();
    expect(screen.getByText(/source:\s*ocs/)).toBeInTheDocument();
    expect(screen.getByText(/startingCSV:\s*testapp/)).toBeInTheDocument();
  });
});
