import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';
import { referenceForModel } from '@console/internal/module/k8s';
import { DetailsPage } from '@console/internal/components/factory';
import { ErrorBoundary } from '@console/shared/src/components/error/error-boundary';
import { Firehose, LoadingBox, DetailsItem } from '@console/internal/components/utils';
import { CreateYAML, CreateYAMLProps } from '@console/internal/components/create-yaml';
import {
  SubscriptionModel,
  CatalogSourceModel,
  PackageManifestModel,
  OperatorGroupModel,
} from '../models';
import { testCatalogSource, testPackageManifest, dummyPackageManifest } from '../../mocks';
import {
  CatalogSourceDetails,
  CatalogSourceDetailsProps,
  CatalogSourceDetailsPage,
  CatalogSourceDetailsPageProps,
  CreateSubscriptionYAML,
  CreateSubscriptionYAMLProps,
  CatalogSourceOperatorsPage,
} from './catalog-source';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});
const i18nNS = 'details-page';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe(CatalogSourceDetails.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourceDetailsProps>;
  let obj: CatalogSourceDetailsProps['obj'];

  beforeEach(() => {
    obj = _.cloneDeep(testCatalogSource);
    wrapper = shallow(<CatalogSourceDetails obj={obj} packageManifests={[testPackageManifest]} />);
  });

  it('renders name and publisher of the catalog', () => {
    expect(
      wrapper
        .find(DetailsItem)
        .at(1)
        .props().obj.spec.displayName,
    ).toEqual(obj.spec.displayName);

    expect(
      wrapper
        .find(DetailsItem)
        .at(2)
        .props().obj.spec.publisher,
    ).toEqual(obj.spec.publisher);
  });
});

describe(CatalogSourceDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper<CatalogSourceDetailsPageProps>;
  let match: CatalogSourceDetailsPageProps['match'];

  beforeEach(() => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([dummyPackageManifest, true, null]);
    match = { isExact: true, params: { ns: 'default', name: 'some-catalog' }, path: '', url: '' };
    wrapper = shallow(<CatalogSourceDetailsPage match={match} />);
  });

  it('renders `DetailsPage` with correct props', () => {
    expect(wrapper.find(DetailsPage).props().kind).toEqual(referenceForModel(CatalogSourceModel));

    const detailsPage = wrapper.find(DetailsPage);
    const { pages } = detailsPage.props();
    expect(pages.length).toEqual(3);
    expect(pages[0].nameKey).toEqual(`${i18nNS}~Details`);
    expect(pages[1].nameKey).toEqual(`${i18nNS}~YAML`);
    expect(pages[2].nameKey).toEqual(`olm~Operators`);

    expect(pages[0].component).toEqual(CatalogSourceDetails);
    expect(pages[2].component).toEqual(CatalogSourceOperatorsPage);

    expect(wrapper.find(DetailsPage).props().resources).toEqual([
      {
        kind: referenceForModel(PackageManifestModel),
        isList: true,
        namespace: match.params.ns,
        prop: 'packageManifests',
      },
    ]);
  });
});

describe(CreateSubscriptionYAML.displayName, () => {
  let wrapper: ShallowWrapper<CreateSubscriptionYAMLProps>;

  beforeEach(() => {
    wrapper = shallow(
      <CreateSubscriptionYAML
        match={{
          isExact: true,
          url: '',
          path: '',
          params: { ns: 'default', pkgName: testPackageManifest.metadata.name },
        }}
        location={{
          ...window.location,
          search: `?pkg=${testPackageManifest.metadata.name}&catalog=ocs&catalogNamespace=default`,
        }}
      />,
    );
  });

  it('renders a `Firehose` for the `PackageManfest` specified in the URL', () => {
    expect(wrapper.find<any>(Firehose).props().resources).toEqual([
      {
        kind: referenceForModel(PackageManifestModel),
        isList: false,
        name: testPackageManifest.metadata.name,
        namespace: 'default',
        prop: 'packageManifest',
      },
      {
        kind: referenceForModel(OperatorGroupModel),
        isList: true,
        namespace: 'default',
        prop: 'operatorGroup',
      },
    ]);
  });

  it('renders YAML editor component wrapped by an error boundary component', () => {
    wrapper = wrapper.setProps({
      packageManifest: { loaded: true, data: testPackageManifest },
    } as any);
    const createYAML = wrapper
      .find(Firehose)
      .childAt(0)
      .dive()
      .dive();

    expect(createYAML.find(ErrorBoundary).exists()).toBe(true);
    expect(
      createYAML
        .find(ErrorBoundary)
        .childAt(0)
        .dive()
        .find(CreateYAML)
        .exists(),
    ).toBe(true);
  });

  it('passes example YAML templates using the package default channel', () => {
    wrapper = wrapper.setProps({
      packageManifest: { loaded: true, data: testPackageManifest },
    } as any);

    const createYAML = wrapper
      .find(Firehose)
      .childAt(0)
      .dive()
      .dive()
      .find(ErrorBoundary)
      .childAt(0)
      .dive<CreateYAMLProps, {}>();
    const subTemplate = safeLoad(createYAML.props().template);

    window.location.search = `?pkg=${testPackageManifest.metadata.name}&catalog=ocs&catalogNamespace=default`;

    expect(subTemplate.kind).toContain(SubscriptionModel.kind);
    expect(subTemplate.spec.name).toEqual(testPackageManifest.metadata.name);
    expect(subTemplate.spec.channel).toEqual(testPackageManifest.status.channels[0].name);
    expect(subTemplate.spec.startingCSV).toEqual(testPackageManifest.status.channels[0].currentCSV);
    expect(subTemplate.spec.source).toEqual('ocs');
  });

  it('does not render YAML editor component if `PackageManifest` has not loaded yet', () => {
    wrapper = wrapper.setProps({ packageManifest: { loaded: false } } as any);
    const createYAML = wrapper
      .find(Firehose)
      .childAt(0)
      .dive()
      .dive();

    expect(createYAML.find(CreateYAML).exists()).toBe(false);
    expect(
      createYAML
        .find(ErrorBoundary)
        .childAt(0)
        .dive()
        .find(LoadingBox)
        .exists(),
    ).toBe(true);
  });
});
