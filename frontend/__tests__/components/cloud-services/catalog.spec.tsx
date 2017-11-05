/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash';
import { ShallowWrapper, shallow } from 'enzyme';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import { CatalogsDetailsPage, CatalogDetails, CatalogDetailsProps, CatalogAppHeader, CatalogAppHeaderProps, CatalogAppRow, CatalogAppRowProps, CatalogAppList, CatalogAppListProps, CatalogAppsPage, CatalogAppRowState } from '../../../public/components/cloud-services/catalog';
import { ClusterServiceVersionLogo, ClusterServiceVersionKind, ClusterServiceVersionPhase, CSVConditionReason } from '../../../public/components/cloud-services/index';
import { ClusterServiceVersionModel, UICatalogEntryModel } from '../../../public/models';
import { referenceForModel } from '../../../public/module/k8s';
import { MultiListPage, List, ListHeader, ColHead } from '../../../public/components/factory';
import { NavTitle } from '../../../public/components/utils';
import { testCatalogApp, testClusterServiceVersion, testNamespace } from '../../../__mocks__/k8sResourcesMocks';

describe(CatalogAppRow.displayName, () => {
  let wrapper: ShallowWrapper<CatalogAppRowProps, CatalogAppRowState>;
  let namespaces: CatalogAppRowProps['namespaces'];
  let clusterServiceVersions: ClusterServiceVersionKind[];

  beforeEach(() => {
    namespaces = {
      data: {
        'default': _.cloneDeep(testNamespace),
        'other-ns': {..._.cloneDeep(testNamespace), metadata: {name: 'other-ns'}},
      },
      loaded: true,
      loadError: '',
    };

    wrapper = shallow(<CatalogAppRow.WrappedComponent obj={testCatalogApp} namespaces={namespaces} clusterServiceVersions={[]} />);
  });

  it('renders column for app logo', () => {
    const col = wrapper.find('.co-catalog-app-row').childAt(0);
    const logo = col.find(ClusterServiceVersionLogo);

    expect(logo.props().displayName).toEqual(testCatalogApp.spec.displayName);
    expect(logo.props().provider).toEqual(testCatalogApp.spec.provider);
    expect(logo.props().icon).toEqual(testCatalogApp.spec.icon[0]);
  });

  it('renders link to expand/hide the row if `props.clusterServiceVersions` length is not zero', () => {
    wrapper.setProps({clusterServiceVersions: [testClusterServiceVersion]});
    const link = wrapper.find('a');

    expect(link.text()).toEqual('Show namespace');

    link.simulate('click');
    const col = wrapper.find('.co-catalog-app-row').childAt(1);

    expect(wrapper.find('a').text()).toEqual('Hide namespace');
    expect(col.find('.co-catalog-app-row__details--collapsed').exists()).toBe(false);
  });

  it('renders link to expand/hide the row if `props.clusterServiceVersions` length is greater than 1', () => {
    wrapper.setProps({clusterServiceVersions: [testClusterServiceVersion, testClusterServiceVersion]});
    const link = wrapper.find('a');

    expect(link.text()).toEqual('Show all 2 namespaces');

    link.simulate('click');
    const col = wrapper.find('.co-catalog-app-row').childAt(1);

    expect(wrapper.find('a').text()).toEqual('Hide all 2 namespaces');
    expect(col.find('.co-catalog-app-row__details--collapsed').exists()).toBe(false);
  });

  it('does not render expand/hide link if `props.clusterServiceVersions` length is zero', () => {
    const link = wrapper.find('a');

    expect(link.exists()).toBe(false);
  });

  it('renders empty state for column if given empty list of `ClusterServiceVersions`', () => {
    const col = wrapper.find('.co-catalog-app-row').childAt(1);

    expect(col.childAt(0).childAt(0).childAt(0).shallow().text()).toEqual('Not enabled');
  });

  it('renders installing state if at least one given `ClusterServiceVersion` status phase is `Installing`', () => {
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion)];
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhaseInstalling, reason: CSVConditionReason.CSVReasonRequirementsNotMet};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.find('.co-catalog-app-row').childAt(1);

    expect(col.childAt(0).childAt(0).childAt(0).shallow().text()).toEqual(`Enabling... (2 of ${clusterServiceVersions.length} namespaces)`);
  });

  it('renders error state if at least one given `ClusterServiceVersion` status phase is `Failed`', () => {
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion)];
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhaseFailed, reason: CSVConditionReason.CSVReasonComponentFailed};
    clusterServiceVersions[1].status = {phase: ClusterServiceVersionPhase.CSVPhasePending, reason: CSVConditionReason.CSVReasonRequirementsNotMet};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.find('.co-catalog-app-row').childAt(1);

    expect(col.childAt(0).childAt(0).childAt(0).shallow().text()).toEqual('Error (1 namespace failed, 1 namespace pending, 1 namespace enabled)');
  });

  it('renders success state if all `ClusterServiceVersions` statuses are `Succeeded`', () => {
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion)];

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.find('.co-catalog-app-row').childAt(1);

    expect(col.childAt(0).childAt(0).childAt(0).shallow().text()).toEqual(`Enabled (${clusterServiceVersions.length} namespaces)`);
  });

  it('renders active progress bar in expanded state if at least one `ClusterServiceVersion` status is `Pending` or `Installing`', () => {
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion)];
    clusterServiceVersions[1].status = {phase: ClusterServiceVersionPhase.CSVPhasePending, reason: CSVConditionReason.CSVReasonRequirementsNotMet};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.find('.co-catalog-app-row').childAt(1);
    const progressBar = col.childAt(1).childAt(0).shallow().find('.co-catalog-install-progress-bar--active');

    expect(progressBar.exists()).toBe(true);
  });

  it('does not render progress bar in expanded state if all `ClusterServiceVersion` status are `Succeeded`', () => {
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion)];

    wrapper.setProps({clusterServiceVersions});
    wrapper.setState({expand: true});
    const col = wrapper.find('.co-catalog-app-row').childAt(1);
    const progressBar = col.childAt(1).childAt(0).shallow().find('.co-catalog-install-progress-bar');

    expect(progressBar.exists()).toBe(false);
  });

  it('does not render progress bar in expanded state for `ClusterServiceVersions` that are being deleted', () => {
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion)];
    clusterServiceVersions[0].metadata.deletionTimestamp = '2017-12-08T20:55:08Z';
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhasePending, reason: CSVConditionReason.CSVReasonRequirementsNotMet};
    clusterServiceVersions[1].status = {phase: ClusterServiceVersionPhase.CSVPhasePending, reason: CSVConditionReason.CSVReasonRequirementsNotMet};
    clusterServiceVersions[2].status = {phase: ClusterServiceVersionPhase.CSVPhaseSucceeded, reason: CSVConditionReason.CSVReasonInstallSuccessful};

    wrapper.setProps({clusterServiceVersions});
    wrapper.setState({expand: true});
    const progressBar = wrapper.find('.co-catalog-app-row').childAt(1).childAt(1).childAt(0).shallow().find('.co-catalog-install-progress-bar');

    expect(progressBar.props().style.width).toEqual('50%');
  });

  it('renders list of namespace statuses in expanded state', () => {
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion), _.cloneDeep(testClusterServiceVersion)];
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhaseFailed, reason: CSVConditionReason.CSVReasonComponentFailed};
    clusterServiceVersions[1].status = {phase: ClusterServiceVersionPhase.CSVPhasePending, reason: CSVConditionReason.CSVReasonRequirementsNotMet};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.find('.co-catalog-app-row').childAt(1);
    const namespaceList = col.childAt(1).childAt(0).shallow().find('ul').find('li');

    expect(namespaceList.length).toEqual(clusterServiceVersions.length);
    expect(namespaceList.at(0).text()).toContain(clusterServiceVersions[0].metadata.namespace);
  });

  it('renders link to namespaced app details view for successfully installed namespaces in expanded state', () => {
    wrapper.setProps({clusterServiceVersions: [_.cloneDeep(testClusterServiceVersion)]});
    const col = wrapper.find('.co-catalog-app-row').childAt(1);
    const succeededNamespaces = col.childAt(1).childAt(0).shallow().find('ul').find('.co-catalog-breakdown__ns-list__item');

    expect(succeededNamespaces.length).not.toEqual(0);
    succeededNamespaces.forEach((ns, i) => {
      const csv = clusterServiceVersions[i];

      expect(ns.find(Link).props().to).toEqual(`/ns/${csv.metadata.namespace}/clusterserviceversion-v1s/${csv.metadata.name}`);
    });
  });

  it('renders status reason next to failed namespaces in expanded state', () => {
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion)];
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhaseFailed, reason: CSVConditionReason.CSVReasonComponentFailed};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.find('.co-catalog-app-row').childAt(1);
    const namespaceList = col.childAt(1).childAt(0).shallow().find('ul').find('li');

    namespaceList.forEach((item, i) => {
      expect(item.text()).toEqual(`${clusterServiceVersions[i].metadata.namespace}: ${clusterServiceVersions[i].status.reason}`);
    });
  });

  it('renders disabling namespaces in expanded state', () => {
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion)];
    clusterServiceVersions[0].metadata.deletionTimestamp = '2017-12-08T20:55:08Z';

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.find('.co-catalog-app-row').childAt(1);
    const namespaceList = col.childAt(1).childAt(0).shallow().find('ul').find('li');

    namespaceList.forEach((item, i) => {
      expect(item.text()).toEqual(`${clusterServiceVersions[i].metadata.namespace}: Disabling...`);
    });
  });

  it('shows collapsed row by default', () => {
    const col = wrapper.find('.co-catalog-app-row').childAt(1);

    expect(col.find('.co-catalog-app-row__details--collapsed').exists()).toBe(true);
  });

  it('renders column for actions', () => {
    const col = wrapper.find('.co-catalog-app-row').childAt(2);

    expect(col.find('button.btn-primary').props().disabled).toBe(false);
    expect(col.find('button.btn-default').props().disabled).toBe(true);
  });

  it('renders disabled `Enable` button if no available namespaces', () => {
    wrapper.setProps({clusterServiceVersions: [testClusterServiceVersion]});
    const button: ShallowWrapper<any> = wrapper.find('.co-catalog-app-row').childAt(2).find('button.btn-primary');

    expect(button.props().disabled).toBe(true);
  });

  it('renders `Disable` button if passed at least 1 ClusterServiceVersion', () => {
    wrapper.setProps({clusterServiceVersions: [testClusterServiceVersion]});
    const button: ShallowWrapper<any> = wrapper.find('.co-catalog-app-row').childAt(2).find('button.btn-default');

    expect(button.props().disabled).toBe(false);
  });
});

describe(CatalogAppHeader.displayName, () => {
  let wrapper: ShallowWrapper<CatalogAppHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<CatalogAppHeader />);
  });

  it('renders column header for app logo', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(0);

    expect(colHeader.props().sortField).toEqual('metadata.name');
    expect(colHeader.childAt(0).text()).toEqual('Name');
  });

  it('renders column header for app status', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(1);

    expect(colHeader.childAt(0).text()).toEqual('Status');
  });

  it('renders column header for actions', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(2);
    expect(colHeader.childAt(0).text()).toEqual('');
  });
});

describe(CatalogAppList.displayName, () => {
  let wrapper: ShallowWrapper<CatalogAppListProps>;

  beforeEach(() => {
    wrapper = shallow(<CatalogAppList data={[]} loaded={true} filters={{}} />);
  });

  it('renders a `List` with the correct header, row, and empty message components', () => {
    const list: ShallowWrapper<any> = wrapper.find(List);

    expect(list.props().Header).toEqual(CatalogAppHeader);
    expect(list.props().Row).toEqual(CatalogAppRow);
    expect(list.props().isList).toBe(true);
    expect(list.props().label).toEqual('Applications');
    expect(list.props().EmptyMsg).toBeDefined();
  });
});

describe(CatalogAppsPage.displayName, () => {
  let wrapper: ShallowWrapper<{}>;

  beforeEach(() => {
    wrapper = shallow(<CatalogAppsPage />);
  });

  it('renders a `MultiListPage` with the correct props', () => {
    const listPage = wrapper.find(MultiListPage);

    expect(listPage.props().resources).toEqual([
      {kind: referenceForModel(ClusterServiceVersionModel), isList: true, namespaced: false},
      {kind: 'Namespace', isList: true},
      {kind: referenceForModel(UICatalogEntryModel), isList: true, namespaced: true}
    ]);
    expect(listPage.props().namespace).toEqual('tectonic-system');
    expect(listPage.props().ListComponent).toEqual(CatalogAppList);
    expect(listPage.props().filterLabel).toEqual('Applications by name');
    expect(listPage.props().title).toEqual('Applications');
    expect(listPage.props().showTitle).toBe(true);
  });

  it('passes `flatten` function which returns only list of `UICatalogEntry-v1s`', () => {
    const flatten = wrapper.find(MultiListPage).props().flatten;
    const data = flatten({
      [referenceForModel(UICatalogEntryModel)]: {data: [testCatalogApp]},
      'Namespace': {data: [testNamespace]},
      [referenceForModel(ClusterServiceVersionModel)]: {data: [testClusterServiceVersion]}
    });

    expect(data.length).toEqual(1);
    expect(data.some(({kind}) => kind !== 'UICatalogEntry-v1')).toBe(false);
  });
});

describe(CatalogDetails.displayName, () => {
  let wrapper: ShallowWrapper<CatalogDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(<CatalogDetails />);
  });

  it('renders info section', () => {
    const section = wrapper.find('.co-m-pane__body');
    const name = wrapper.findWhere(node => node.equals(<dt>Name</dt>)).parents().at(0).find('dd');
    const provider = wrapper.findWhere(node => node.equals(<dt>Provider</dt>)).parents().at(0).find('dd');

    expect(section.exists()).toBe(true);
    expect(name.text()).toEqual('Open Cloud Services');
    expect(provider.text()).toEqual('CoreOS, Inc');
  });

  it('renders section with list of available applications from the catalog', () => {
    const section = wrapper.find('.co-m-pane__body-section--bordered');

    expect(section.find(CatalogAppsPage).exists()).toBe(true);
  });
});

describe(CatalogsDetailsPage.displayName, () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(<CatalogsDetailsPage />);
  });

  it('renders a `Helmet` page title with the catalog name', () => {
    expect(wrapper.find(Helmet).exists()).toBe(true);
    expect(wrapper.find(Helmet).find('title').text()).toEqual('Open Cloud Services');
  });

  it('renders a `NavTitle` with the correct catalog name', () => {
    expect(wrapper.find(NavTitle).exists()).toBe(true);
    expect(wrapper.find(NavTitle).props().detail).toBe(true);
    expect(wrapper.find(NavTitle).props().title).toEqual('Open Cloud Services');
  });

  it('renders a `CatalogDetails` component', () => {
    expect(wrapper.find(CatalogDetails).exists()).toBe(true);
  });
});
