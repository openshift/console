import * as React from 'react';
import { shallow, ShallowWrapper, mount, ReactWrapper } from 'enzyme';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';
import { CardHeader, CardBody, CardFooter } from '@patternfly/react-core';
import { ErrorBoundary } from '@console/shared/src/components/error/error-boundary';
import {
  DetailsPage,
  TableInnerProps,
  Table,
  TableRow,
} from '@console/internal/components/factory';
import {
  Timestamp,
  ResourceKebab,
  ScrollToTopOnMount,
  SectionHeading,
  resourceObjPath,
  StatusBox,
} from '@console/internal/components/utils';
import * as rbac from '@console/internal/components/utils/rbac';
import { referenceForModel } from '@console/internal/module/k8s';
import * as operatorLogo from '@console/internal/imgs/operator.svg';
import {
  testClusterServiceVersion,
  testSubscription,
  testPackageManifest,
  testCatalogSource,
  testInstallPlan,
} from '../../mocks';
import { ClusterServiceVersionModel } from '../models';
import { ClusterServiceVersionKind, ClusterServiceVersionPhase } from '../types';
import {
  ClusterServiceVersionsDetailsPage,
  ClusterServiceVersionsDetailsPageProps,
  ClusterServiceVersionDetails,
  ClusterServiceVersionDetailsProps,
  NamespacedClusterServiceVersionList,
  ClusterServiceVersionTableRow,
  NamespacedClusterServiceVersionTableRow,
  ClusterServiceVersionTableRowProps,
  CRDCard,
  CRDCardRow,
  CSVSubscription,
  CSVSubscriptionProps,
  SingleProjectTableHeader,
  AllProjectsTableHeader,
} from './clusterserviceversion';
import { SubscriptionUpdates, SubscriptionDetails } from './subscription';
import {
  ClusterServiceVersionLogo,
  ClusterServiceVersionLogoProps,
  referenceForProvidedAPI,
} from '.';

describe('SingleProjectTableHeader.displayName', () => {
  it('returns single project column header definition for cluster service version table header', () => {
    expect(Array.isArray(SingleProjectTableHeader()));
  });
});

describe('AllProjectsTableHeader.displayName', () => {
  it('returns all projects column header definition for cluster service version table header', () => {
    expect(Array.isArray(AllProjectsTableHeader()));
  });
});

describe(ClusterServiceVersionTableRow.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionTableRowProps>;

  beforeEach(() => {
    wrapper = shallow(
      <NamespacedClusterServiceVersionTableRow
        activeNamespace="test"
        catalogSourceMissing={false}
        obj={testClusterServiceVersion}
        subscription={testSubscription}
        index={0}
        rowKey={'0'}
        style={{}}
      />,
    )
      .childAt(0)
      .shallow();
  });

  it('renders a component wrapped in an `ErrorBoundary', () => {
    wrapper = shallow(
      <NamespacedClusterServiceVersionTableRow
        catalogSourceMissing={false}
        obj={testClusterServiceVersion}
        subscription={testSubscription}
        index={0}
        rowKey={'0'}
        style={{}}
      />,
    );

    expect(wrapper.find(ErrorBoundary).exists()).toBe(true);
  });

  it('renders `ResourceKebab` with actions', () => {
    const col = wrapper.find(TableRow);

    expect(col.find(ResourceKebab).props().resource).toEqual(testClusterServiceVersion);
    expect(col.find(ResourceKebab).props().kind).toEqual(
      referenceForModel(ClusterServiceVersionModel),
    );
    expect(col.find(ResourceKebab).props().actions.length).toEqual(2);
  });

  it('renders clickable column for app logo and name', () => {
    const col = wrapper.find(TableRow).childAt(0);

    expect(col.find(Link).props().to).toEqual(
      resourceObjPath(testClusterServiceVersion, referenceForModel(ClusterServiceVersionModel)),
    );
    expect(
      col
        .find(Link)
        .find(ClusterServiceVersionLogo)
        .exists(),
    ).toBe(true);
  });

  it('renders column for managedNamespace', () => {
    const col = wrapper.find(TableRow).childAt(1);
    const managedNamespace = col.childAt(0);
    expect(managedNamespace.exists()).toBeTruthy();
  });

  it('renders column for last updated', () => {
    const col = wrapper.find(TableRow).childAt(3);
    expect(col.render().text()).toContain('years from now');
  });

  it('renders column for app status', () => {
    const col = wrapper.find(TableRow).childAt(2);
    const statusComponent = col.childAt(0).find('ClusterServiceVersionStatus');
    expect(statusComponent.exists()).toBeTruthy();
    expect(statusComponent.render().text()).toContain(ClusterServiceVersionPhase.CSVPhaseSucceeded);
  });

  it('renders "disabling" status if CSV has `deletionTimestamp`', () => {
    wrapper = wrapper.setProps({
      obj: _.cloneDeepWith(testClusterServiceVersion, (v, k) =>
        k === 'metadata' ? { ...v, deletionTimestamp: Date.now() } : undefined,
      ),
    });
    const col = wrapper.find(TableRow).childAt(2);

    expect(
      col
        .childAt(0)
        .find('ClusterServiceVersionStatus')
        .render()
        .text(),
    ).toEqual('Deleting');
  });

  it('renders column with each CRD provided by the Operator', () => {
    const col = wrapper.find(TableRow).childAt(4);
    testClusterServiceVersion.spec.customresourcedefinitions.owned.forEach((desc, i) => {
      expect(
        col
          .find(Link)
          .at(i)
          .props().title,
      ).toEqual(desc.name);
      expect(
        col
          .find(Link)
          .at(i)
          .props().to,
      ).toEqual(
        `${resourceObjPath(
          testClusterServiceVersion,
          referenceForModel(ClusterServiceVersionModel),
        )}/${referenceForProvidedAPI(desc)}`,
      );
    });
  });
});

describe(ClusterServiceVersionLogo.displayName, () => {
  let wrapper: ReactWrapper<ClusterServiceVersionLogoProps>;

  beforeEach(() => {
    const { provider, icon, displayName } = testClusterServiceVersion.spec;
    wrapper = mount(
      <ClusterServiceVersionLogo icon={icon[0]} displayName={displayName} provider={provider} />,
    );
  });

  it('renders logo image from given base64 encoded image string', () => {
    const image: ReactWrapper<React.ImgHTMLAttributes<any>> = wrapper.find('img');

    expect(image.props().src).toEqual(
      `data:${testClusterServiceVersion.spec.icon[0].mediatype};base64,${testClusterServiceVersion.spec.icon[0].base64data}`,
    );
  });

  it('renders fallback image if given icon is invalid', () => {
    wrapper.setProps({ icon: null });
    const fallbackImg: ReactWrapper<React.ImgHTMLAttributes<any>> = wrapper.find('img');

    expect(fallbackImg.props().src).toEqual(operatorLogo);
  });

  it('renders ClusterServiceVersion name and provider from given spec', () => {
    expect(wrapper.text()).toContain(testClusterServiceVersion.spec.displayName);
    expect(wrapper.text()).toContain(`by ${testClusterServiceVersion.spec.provider.name}`);
  });
});

describe(NamespacedClusterServiceVersionList.displayName, () => {
  it('renders `List` with correct props', () => {
    const wrapper = shallow(
      <NamespacedClusterServiceVersionList
        activeNamespace="test"
        data={[]}
        subscriptions={{ loaded: true, data: [testSubscription], loadError: null }}
        catalogSources={{ loaded: true, data: [testCatalogSource], loadError: null }}
        loaded
      />,
    );

    expect(wrapper.find<TableInnerProps>(Table).props().Header).toEqual(SingleProjectTableHeader);
  });
});

describe(CRDCard.displayName, () => {
  const crd = testClusterServiceVersion.spec.customresourcedefinitions.owned[0];

  it('renders a card with title, body, and footer', () => {
    const wrapper = shallow(<CRDCard canCreate crd={crd} csv={testClusterServiceVersion} />);

    expect(wrapper.find(CardHeader).exists()).toBe(true);
    expect(wrapper.find(CardBody).exists()).toBe(true);
    expect(wrapper.find(CardFooter).exists()).toBe(true);
  });

  it('renders a link to create a new instance', () => {
    const wrapper = shallow(<CRDCard canCreate crd={crd} csv={testClusterServiceVersion} />);

    expect(
      wrapper
        .find(CardFooter)
        .find(Link)
        .props().to,
    ).toEqual(
      `/k8s/ns/${testClusterServiceVersion.metadata.namespace}/${
        ClusterServiceVersionModel.plural
      }/${testClusterServiceVersion.metadata.name}/${referenceForProvidedAPI(crd)}/~new`,
    );
  });

  it('does not render link to create new instance if `props.canCreate` is false', () => {
    const wrapper = shallow(
      <CRDCard canCreate={false} crd={crd} csv={testClusterServiceVersion} />,
    );

    expect(
      wrapper
        .find(CardFooter)
        .find(Link)
        .exists(),
    ).toBe(false);
  });
});

describe(ClusterServiceVersionDetails.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(
      <ClusterServiceVersionDetails obj={_.cloneDeep(testClusterServiceVersion)} />,
    );
  });

  it('renders `ScrollToTopOnMount` component', () => {
    expect(wrapper.find(ScrollToTopOnMount).exists()).toBe(true);
  });

  it('renders row of cards for each "owned" CRD for the given `ClusterServiceVersion`', () => {
    expect(wrapper.find(CRDCardRow).props().csv).toEqual(testClusterServiceVersion);
    expect(wrapper.find(CRDCardRow).props().crdDescs).toEqual(
      testClusterServiceVersion.spec.customresourcedefinitions.owned,
    );
  });

  it('renders description section for ClusterServiceVersion', () => {
    expect(
      wrapper
        .find('.co-m-pane__body')
        .at(0)
        .find(SectionHeading)
        .at(1)
        .props().text,
    ).toEqual('Description');
  });

  it('renders creation date from ClusterServiceVersion', () => {
    expect(wrapper.find(Timestamp).props().timestamp).toEqual(
      testClusterServiceVersion.metadata.creationTimestamp,
    );
  });

  it('renders list of maintainers from ClusterServiceVersion', () => {
    const maintainers = wrapper
      .findWhere((node) => node.equals(<dt>Maintainers</dt>))
      .parents()
      .at(0)
      .find('dd');

    expect(maintainers.length).toEqual(testClusterServiceVersion.spec.maintainers.length);

    testClusterServiceVersion.spec.maintainers.forEach((maintainer, i) => {
      expect(maintainers.at(i).text()).toContain(maintainer.name);
      expect(
        maintainers
          .at(i)
          .find('.co-break-all')
          .text(),
      ).toEqual(maintainer.email);
      expect(
        maintainers
          .at(i)
          .find('.co-break-all')
          .props().href,
      ).toEqual(`mailto:${maintainer.email}`);
    });
  });

  it('renders important links from ClusterServiceVersion', () => {
    const links = wrapper
      .findWhere((node) => node.equals(<dt>Links</dt>))
      .parents()
      .at(0)
      .find('dd');

    expect(links.length).toEqual(testClusterServiceVersion.spec.links.length);
  });

  it('renders empty state for unfulfilled outputs and metadata', () => {
    const emptyClusterServiceVersion: ClusterServiceVersionKind = _.cloneDeep(
      testClusterServiceVersion,
    );
    emptyClusterServiceVersion.spec.description = '';
    emptyClusterServiceVersion.spec.provider = undefined;
    emptyClusterServiceVersion.spec.links = [];
    emptyClusterServiceVersion.spec.maintainers = [];
    wrapper.setProps({ obj: emptyClusterServiceVersion });

    const provider = wrapper
      .findWhere((node) => node.equals(<dt>Provider</dt>))
      .parents()
      .at(0)
      .find('dd')
      .at(0);
    const links = wrapper
      .findWhere((node) => node.equals(<dt>Links</dt>))
      .parents()
      .at(0)
      .find('dd');
    const maintainers = wrapper
      .findWhere((node) => node.equals(<dt>Maintainers</dt>))
      .parents()
      .at(0)
      .find('dd');

    expect(provider.text()).toEqual('Not available');
    expect(links.text()).toEqual('Not available');
    expect(maintainers.text()).toEqual('Not available');
  });

  it('renders info section for ClusterServiceVersion', () => {
    expect(
      wrapper
        .find('.co-m-pane__body')
        .at(1)
        .find(SectionHeading)
        .props().text,
    ).toEqual('ClusterServiceVersion Details');
  });

  it('renders conditions section for ClusterServiceVersion', () => {
    expect(
      wrapper
        .find('.co-m-pane__body')
        .at(2)
        .find(SectionHeading)
        .props().text,
    ).toEqual('Conditions');
  });
});

describe(CSVSubscription.displayName, () => {
  let wrapper: ShallowWrapper<CSVSubscriptionProps>;

  it('renders `StatusBox` with correct props when Operator subscription does not exist', () => {
    wrapper = shallow(
      <CSVSubscription
        obj={testClusterServiceVersion}
        packageManifests={[]}
        subscriptions={[]}
        catalogSources={[]}
        installPlans={[]}
      />,
    );

    expect(wrapper.find(StatusBox).props().EmptyMsg).toBeDefined();
    expect(wrapper.find(StatusBox).props().loaded).toBe(true);
    expect(wrapper.find(StatusBox).props().data).toBeUndefined();
  });

  it('renders `SubscriptionDetails` with correct props when Operator subscription exists', () => {
    const obj = _.set(_.cloneDeep(testClusterServiceVersion), 'metadata.annotations', {
      'olm.operatorNamespace': 'default',
    });
    const subscription = _.set(_.cloneDeep(testSubscription), 'status', {
      installedCSV: obj.metadata.name,
    });

    wrapper = shallow(
      <CSVSubscription
        obj={obj}
        packageManifests={[testPackageManifest]}
        subscriptions={[testSubscription, subscription]}
        catalogSources={[testCatalogSource]}
        installPlans={[testInstallPlan]}
      />,
    );

    const subscriptionUpdates = wrapper
      .find(StatusBox)
      .find(SubscriptionDetails)
      .dive()
      .find(SubscriptionUpdates);
    expect(subscriptionUpdates.props().obj).toEqual(subscription);
    expect(subscriptionUpdates.props().installedCSV).toEqual(obj);
    expect(subscriptionUpdates.props().pkg).toEqual(testPackageManifest);
  });

  it('passes the matching `PackageManifest` if there are multiple with the same `metadata.name`', () => {
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

    wrapper = shallow(
      <CSVSubscription
        obj={obj}
        packageManifests={[testPackageManifest, otherPkg]}
        subscriptions={[testSubscription, subscription]}
        catalogSources={[testCatalogSource]}
        installPlans={[testInstallPlan]}
      />,
    );

    expect(
      wrapper
        .find(StatusBox)
        .find(SubscriptionDetails)
        .dive()
        .find(SubscriptionUpdates)
        .props().pkg,
    ).toEqual(testPackageManifest);
  });
});

describe(ClusterServiceVersionsDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionsDetailsPageProps>;
  const name = 'example';
  const ns = 'default';

  beforeEach(() => {
    spyOn(rbac, 'useAccessReview').and.returnValue(true);
    wrapper = shallow(
      <ClusterServiceVersionsDetailsPage
        match={{ params: { ns, name }, isExact: true, url: '', path: '' }}
      />,
    );
  });

  it('passes URL parameters to `DetailsPage`', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.props().namespace).toEqual(ns);
    expect(detailsPage.props().name).toEqual(name);
    expect(detailsPage.props().kind).toEqual(referenceForModel(ClusterServiceVersionModel));
  });

  it('renders a `DetailsPage` with the correct subpages', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[0].name).toEqual('Details');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[0].href).toEqual('');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[0].component).toEqual(
      ClusterServiceVersionDetails,
    );
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[1].name).toEqual('YAML');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[1].href).toEqual('yaml');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[2].name).toEqual('Subscription');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[2].href).toEqual('subscription');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[3].name).toEqual('Events');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[3].href).toEqual('events');
  });

  it('includes tab for each "owned" CRD', () => {
    const detailsPage = wrapper.find(DetailsPage);

    const csv = _.cloneDeep(testClusterServiceVersion);
    csv.spec.customresourcedefinitions.owned = csv.spec.customresourcedefinitions.owned.concat([
      { name: 'e.example.com', kind: 'E', version: 'v1', displayName: 'E' },
    ]);

    expect(detailsPage.props().pagesFor(csv)[4].name).toEqual('All Instances');
    expect(detailsPage.props().pagesFor(csv)[4].href).toEqual('instances');
    csv.spec.customresourcedefinitions.owned.forEach((desc, i) => {
      expect(detailsPage.props().pagesFor(csv)[5 + i].name).toEqual(desc.displayName);
      expect(detailsPage.props().pagesFor(csv)[5 + i].href).toEqual(referenceForProvidedAPI(desc));
    });
  });

  it('does not include "All Instances" tab if only one "owned" CRD', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(
      detailsPage
        .props()
        .pagesFor(testClusterServiceVersion)
        .some((p) => p.name === 'All Instances'),
    ).toBe(false);
  });
});
