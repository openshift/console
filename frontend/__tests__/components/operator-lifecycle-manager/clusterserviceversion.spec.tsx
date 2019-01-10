/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import { shallow, ShallowWrapper, mount, ReactWrapper } from 'enzyme';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';

import { ClusterServiceVersionsDetailsPage, ClusterServiceVersionsDetailsPageProps, ClusterServiceVersionDetails, ClusterServiceVersionDetailsProps, ClusterServiceVersionsPage, ClusterServiceVersionsPageProps, ClusterServiceVersionList, ClusterServiceVersionHeader, ClusterServiceVersionRow, ClusterServiceVersionRowProps, CRDCard, CRDCardRow } from '../../../public/components/operator-lifecycle-manager/clusterserviceversion';
import { ClusterServiceVersionKind, ClusterServiceVersionLogo, ClusterServiceVersionLogoProps, referenceForProvidedAPI, CSVConditionReason } from '../../../public/components/operator-lifecycle-manager';
import { DetailsPage, ListPage, ListHeader, ColHead, List, ListInnerProps } from '../../../public/components/factory';
import { testClusterServiceVersion, testModel } from '../../../__mocks__/k8sResourcesMocks';
import { Timestamp, OverflowLink, MsgBox, ResourceLink, ResourceKebab, ErrorBoundary, LoadingBox, ScrollToTopOnMount, SectionHeading } from '../../../public/components/utils';
import { referenceForModel } from '../../../public/module/k8s';
import { ClusterServiceVersionModel } from '../../../public/models';

import * as operatorLogo from '../../../public/imgs/operator.svg';

describe(ClusterServiceVersionHeader.displayName, () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionHeader />);
  });

  it('renders `ListHeader`', () => {
    expect(wrapper.find(ListHeader).exists()).toBe(true);
  });

  it('renders column header for app name and logo', () => {
    expect(wrapper.find(ColHead).at(0).childAt(0).text()).toEqual('Name');
    expect(wrapper.find(ColHead).at(0).props().sortField).toEqual('metadata.name');
  });

  it('renders column header for app namespace', () => {
    expect(wrapper.find(ColHead).at(1).childAt(0).text()).toEqual('Namespace');
  });

  it('renders column header for Operator deployment', () => {
    expect(wrapper.find(ColHead).at(2).childAt(0).text()).toEqual('Deployment');
  });

  it('renders column header for app status', () => {
    expect(wrapper.find(ColHead).at(3).childAt(0).text()).toEqual('Status');
  });
});

describe(ClusterServiceVersionRow.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionRowProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionRow obj={testClusterServiceVersion} />).childAt(0).shallow();
  });

  it('renders a component wrapped in an `ErrorBoundary', () => {
    wrapper = shallow(<ClusterServiceVersionRow obj={testClusterServiceVersion} />);

    expect(wrapper.find(ErrorBoundary).exists()).toBe(true);
  });

  it('renders `ResourceKebab` with actions', () => {
    const col = wrapper.find('.row');

    expect(col.find(ResourceKebab).props().resource).toEqual(testClusterServiceVersion);
    expect(col.find(ResourceKebab).props().kind).toEqual(referenceForModel(ClusterServiceVersionModel));
    expect(col.find(ResourceKebab).props().actions.length).toEqual(2);
  });

  it('renders clickable column for app logo and name', () => {
    const col = wrapper.find('.row').childAt(0);

    expect(col.find(Link).props().to).toEqual(`/k8s/ns/${testClusterServiceVersion.metadata.namespace}/${ClusterServiceVersionModel.plural}/${testClusterServiceVersion.metadata.name}`);
    expect(col.find(Link).find(ClusterServiceVersionLogo).exists()).toBe(true);
  });

  it('renders column for app namespace link', () => {
    const link = wrapper.find('.row').childAt(1).find(ResourceLink);

    expect(link.props().kind).toEqual('Namespace');
    expect(link.props().title).toEqual(testClusterServiceVersion.metadata.namespace);
    expect(link.props().name).toEqual(testClusterServiceVersion.metadata.namespace);
  });

  it('renders column with link to Operator deployment', () => {
    const col = wrapper.find('.row').childAt(2);

    expect(col.find(ResourceLink).props().kind).toEqual('Deployment');
    expect(col.find(ResourceLink).props().name).toEqual(testClusterServiceVersion.spec.install.spec.deployments[0].name);
  });

  it('renders column for app status', () => {
    const col = wrapper.find('.row').childAt(3);

    expect(col.childAt(0).text()).toEqual(CSVConditionReason.CSVReasonInstallSuccessful);
  });

  it('renders "disabling" status if CSV has `deletionTimestamp`', () => {
    wrapper = wrapper.setProps({obj: _.cloneDeepWith(testClusterServiceVersion, (v, k) => k === 'metadata' ? {...v, deletionTimestamp: Date.now()} : undefined)});
    const col = wrapper.find('.row').childAt(3);

    expect(col.childAt(0).text()).toEqual('Disabling');
  });

  it('renders column with each CRD provided by the Operator', () => {
    const col = wrapper.find('.row').childAt(4);
    testClusterServiceVersion.spec.customresourcedefinitions.owned.forEach((desc, i) => {
      expect(col.find(Link).at(i).props().title).toEqual(desc.name);
      expect(col.find(Link).at(i).props().to).toEqual(`/k8s/ns/default/clusterserviceversions/testapp/${referenceForProvidedAPI(desc)}`);
    });
  });
});

describe(ClusterServiceVersionLogo.displayName, () => {
  let wrapper: ReactWrapper<ClusterServiceVersionLogoProps>;

  beforeEach(() => {
    const {provider, icon, displayName} = testClusterServiceVersion.spec;
    wrapper = mount(<ClusterServiceVersionLogo icon={icon} displayName={displayName} provider={provider} />);
  });

  it('renders logo image from given base64 encoded image string', () => {
    const image: ReactWrapper<React.ImgHTMLAttributes<any>> = wrapper.find('img');

    expect(image.props().height).toEqual('40');
    expect(image.props().width).toEqual('40');
    expect(image.props().src).toEqual(`data:${testClusterServiceVersion.spec.icon.mediatype};base64,${testClusterServiceVersion.spec.icon.base64data}`);
  });

  it('renders fallback image if given icon is invalid', () => {
    wrapper.setProps({icon: null});
    const fallbackImg: ReactWrapper<React.ImgHTMLAttributes<any>> = wrapper.find('img');

    expect(fallbackImg.props().src).toEqual(operatorLogo);
    expect(fallbackImg.props().height).toEqual('40');
    expect(fallbackImg.props().width).toEqual('40');
  });

  it('renders ClusterServiceVersion name and provider from given spec', () => {
    expect(wrapper.text()).toContain(testClusterServiceVersion.spec.displayName);
    expect(wrapper.text()).toContain(`by ${testClusterServiceVersion.spec.provider.name}`);
  });
});

describe(ClusterServiceVersionList.displayName, () => {

  it('renders `List` with correct props', () => {
    const wrapper = shallow(<ClusterServiceVersionList data={[]} loaded={true} />);

    expect(wrapper.find<ListInnerProps>(List).props().Row).toEqual(ClusterServiceVersionRow);
    expect(wrapper.find<ListInnerProps>(List).props().Header).toEqual(ClusterServiceVersionHeader);
  });
});

describe(ClusterServiceVersionsPage.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionsPageProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionsPage.WrappedComponent kind={referenceForModel(ClusterServiceVersionModel)} resourceDescriptions={[]} namespace="foo" />);
  });

  it('renders a `ListPage` with correct props', () => {
    const listPage = wrapper.find(ListPage);

    expect(listPage.props().kind).toEqual(referenceForModel(ClusterServiceVersionModel));
    expect(listPage.props().ListComponent).toEqual(ClusterServiceVersionList);
    expect(listPage.props().filterLabel).toEqual('Cluster Service Versions by name');
    expect(listPage.props().showTitle).toBe(false);
  });

  it('renders `LoadingBox` if still detecting OpenShift or namespaces/projects are loading', () => {
    wrapper = wrapper.setProps({loading: true});
    const msgBox = wrapper.find(MsgBox);
    const listPage = wrapper.find(ListPage);

    expect(listPage.exists()).toBe(false);
    expect(msgBox.exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });
});

describe(CRDCard.displayName, () => {
  const crd = testClusterServiceVersion.spec.customresourcedefinitions.owned[0];

  it('renders a card with title, body, and footer', () => {
    const wrapper = shallow(<CRDCard.WrappedComponent crd={crd} csv={testClusterServiceVersion} kindObj={testModel} />);

    expect(wrapper.find('.co-crd-card__title').exists()).toBe(true);
    expect(wrapper.find('.co-crd-card__body').exists()).toBe(true);
    expect(wrapper.find('.co-crd-card__footer').exists()).toBe(true);
  });

  it('renders a link to create a new instance', () => {
    const kindObj = _.cloneDeep({...testModel, verbs: ['create']});
    const wrapper = shallow(<CRDCard.WrappedComponent crd={crd} csv={testClusterServiceVersion} kindObj={kindObj} />);

    expect(wrapper.find('.co-crd-card__footer').find(Link).props().to).toEqual(`/k8s/ns/${testClusterServiceVersion.metadata.namespace}/${ClusterServiceVersionModel.plural}/${testClusterServiceVersion.metadata.name}/${referenceForProvidedAPI(crd)}/new`);
  });

  it('does not render link to create new instance if "create" not included in verbs for the model', () => {
    const wrapper = shallow(<CRDCard.WrappedComponent crd={crd} csv={testClusterServiceVersion} kindObj={testModel} />);

    expect(wrapper.find('.co-crd-card__footer').find(Link).exists()).toBe(false);
  });
});

describe(ClusterServiceVersionDetails.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionDetails obj={_.cloneDeep(testClusterServiceVersion)} />);
  });

  it('renders `ScrollToTopOnMount` component', () => {
    expect(wrapper.find(ScrollToTopOnMount).exists()).toBe(true);
  });

  it('renders row of cards for each "owned" CRD for the given `ClusterServiceVersion`', () => {
    expect(wrapper.find(CRDCardRow).props().csv).toEqual(testClusterServiceVersion);
    expect(wrapper.find(CRDCardRow).props().crdDescs).toEqual(testClusterServiceVersion.spec.customresourcedefinitions.owned);
  });

  it('renders description section for ClusterServiceVersion', () => {
    expect(wrapper.find('.co-m-pane__body').at(0).find(SectionHeading).at(1).props().text).toEqual('Description');
  });

  it('renders creation date from ClusterServiceVersion', () => {
    expect(wrapper.find(Timestamp).props().timestamp).toEqual(testClusterServiceVersion.metadata.creationTimestamp);
  });

  it('renders list of maintainers from ClusterServiceVersion', () => {
    const maintainers = wrapper.findWhere(node => node.equals(<dt>Maintainers</dt>)).parents().at(0).find('dd');

    expect(maintainers.length).toEqual(testClusterServiceVersion.spec.maintainers.length);

    testClusterServiceVersion.spec.maintainers.forEach((maintainer, i) => {
      expect(maintainers.at(i).text()).toContain(maintainer.name);
      expect(maintainers.at(i).find(OverflowLink).props().value).toEqual(maintainer.email);
      expect(maintainers.at(i).find(OverflowLink).props().href).toEqual(`mailto:${maintainer.email}`);
    });
  });

  it('renders important links from ClusterServiceVersion', () => {
    const links = wrapper.findWhere(node => node.equals(<dt>Links</dt>)).parents().at(0).find('dd');

    expect(links.length).toEqual(testClusterServiceVersion.spec.links.length);
  });

  it('renders empty state for unfulfilled outputs and metadata', () => {
    const emptyClusterServiceVersion: ClusterServiceVersionKind = _.cloneDeep(testClusterServiceVersion);
    emptyClusterServiceVersion.spec.description = '';
    emptyClusterServiceVersion.spec.provider = undefined;
    emptyClusterServiceVersion.spec.links = [];
    emptyClusterServiceVersion.spec.maintainers = [];
    wrapper.setProps({obj: emptyClusterServiceVersion});

    const provider = wrapper.findWhere(node => node.equals(<dt>Provider</dt>)).parents().at(0).find('dd').at(0);
    const links = wrapper.findWhere(node => node.equals(<dt>Links</dt>)).parents().at(0).find('dd');
    const maintainers = wrapper.findWhere(node => node.equals(<dt>Maintainers</dt>)).parents().at(0).find('dd');

    expect(provider.text()).toEqual('Not available');
    expect(links.text()).toEqual('Not available');
    expect(maintainers.text()).toEqual('Not available');
  });

  it('renders info section for ClusterServiceVersion', () => {
    expect(wrapper.find('.co-m-pane__body').at(1).find(SectionHeading).props().text).toEqual('ClusterServiceVersion Overview');
  });

  it('renders conditions section for ClusterServiceVersion', () => {
    expect(wrapper.find('.co-m-pane__body').at(2).find(SectionHeading).props().text).toEqual('Conditions');
  });
});

describe(ClusterServiceVersionsDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper<ClusterServiceVersionsDetailsPageProps>;
  const name = 'example';
  const ns = 'default';

  beforeEach(() => {
    wrapper = shallow(<ClusterServiceVersionsDetailsPage match={{params: {ns, name}, isExact: true, url: '', path: ''}} />);
  });

  it('passes URL parameters to `DetailsPage`', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.props().namespace).toEqual(ns);
    expect(detailsPage.props().name).toEqual(name);
    expect(detailsPage.props().kind).toEqual(referenceForModel(ClusterServiceVersionModel));
  });

  it('renders a `DetailsPage` with the correct subpages', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[0].name).toEqual('Overview');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[0].href).toEqual('');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[0].component).toEqual(ClusterServiceVersionDetails);
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[1].name).toEqual('YAML');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[1].href).toEqual('yaml');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[2].name).toEqual('Events');
    expect(detailsPage.props().pagesFor(testClusterServiceVersion)[2].href).toEqual('events');
  });

  it('includes tab for each "owned" CRD', () => {
    const detailsPage = wrapper.find(DetailsPage);

    const csv = _.cloneDeep(testClusterServiceVersion);
    csv.spec.customresourcedefinitions.owned = csv.spec.customresourcedefinitions.owned.concat([{name: 'e.example.com', kind: 'E', version: 'v1', displayName: 'E'}]);

    expect(detailsPage.props().pagesFor(csv)[3].name).toEqual('All Instances');
    expect(detailsPage.props().pagesFor(csv)[3].href).toEqual('instances');
    csv.spec.customresourcedefinitions.owned.forEach((desc, i) => {
      expect(detailsPage.props().pagesFor(csv)[4 + i].name).toEqual(desc.displayName);
      expect(detailsPage.props().pagesFor(csv)[4 + i].href).toEqual(referenceForProvidedAPI(desc));
    });
  });

  it('does not include "All Instances" tab if only one "owned" CRD', () => {
    const detailsPage = wrapper.find(DetailsPage);

    expect(detailsPage.props().pagesFor(testClusterServiceVersion).some(p => p.name === 'All Instances')).toBe(false);
  });
});
