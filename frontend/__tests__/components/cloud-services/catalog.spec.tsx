/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash';
import { ShallowWrapper, shallow } from 'enzyme';
import { Helmet } from 'react-helmet';

import { CatalogsDetailsPage, CatalogDetails, CatalogDetailsProps, CatalogAppHeader, CatalogAppHeaderProps, CatalogAppRow, CatalogAppRowProps, CatalogAppList, CatalogAppListProps, CatalogAppsPage, CatalogAppRowState } from '../../../public/components/cloud-services/catalog';
import { AppTypeLogo, AppTypeKind, ClusterServiceVersionPhase, CSVConditionReason } from '../../../public/components/cloud-services/index';
import { ListPage, List, ListHeader, ColHead } from '../../../public/components/factory';
import { NavTitle } from '../../../public/components/utils';
import { testCatalogApp, testAppType, testNamespace } from '../../../__mocks__/k8sResourcesMocks';

describe('CatalogAppRow', () => {
  let wrapper: ShallowWrapper<CatalogAppRowProps, CatalogAppRowState>;
  let namespaces: CatalogAppRowProps['namespaces'];
  let clusterServiceVersions: AppTypeKind[];

  beforeEach(() => {
    namespaces = {
      data: {
        'default': {...testNamespace},
        'other-ns': {...testNamespace, metadata: {name: 'other-ns'}},
      },
      loaded: true,
      loadError: '',
    };

    wrapper = shallow(<CatalogAppRow.WrappedComponent obj={testCatalogApp} namespaces={namespaces} clusterServiceVersions={[]} />);
  });

  it('renders column for app logo', () => {
    const col = wrapper.childAt(0);
    const logo = col.find(AppTypeLogo);

    expect(logo.props().displayName).toEqual(testCatalogApp.spec.displayName);
    expect(logo.props().provider.name).toEqual(testCatalogApp.spec.provider);
    expect(logo.props().icon).toEqual(testCatalogApp.spec.icon[0]);
  });

  it('renders link to expand/hide the row', () => {
    const col = wrapper.childAt(1);

    expect(col.find('a').text()).toEqual('Show Details');
  });

  it('renders empty state for column if given empty list of `ClusterServiceVersions`', () => {
    const col = wrapper.childAt(1);

    expect(col.childAt(0).childAt(0).shallow().text()).toEqual('Not installed');
  });

  it('renders installing state if at least one given `ClusterServiceVersion` status phase is `Installing`', () => {
    clusterServiceVersions = [_.cloneDeep(testAppType), _.cloneDeep(testAppType), _.cloneDeep(testAppType)];
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhaseInstalling, reason: CSVConditionReason.CSVReasonRequirementsNotMet};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.childAt(1);

    expect(col.childAt(0).childAt(0).shallow().text()).toEqual(`Installing... (2 of ${clusterServiceVersions.length} namespaces)`);
  });

  it('renders error state if at least one given `ClusterServiceVersion` status phase is `Failed`', () => {
    clusterServiceVersions = [_.cloneDeep(testAppType), _.cloneDeep(testAppType), _.cloneDeep(testAppType)];
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhaseFailed, reason: CSVConditionReason.CSVReasonComponentFailed};
    clusterServiceVersions[1].status = {phase: ClusterServiceVersionPhase.CSVPhasePending, reason: CSVConditionReason.CSVReasonRequirementsNotMet};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.childAt(1);

    expect(col.childAt(0).childAt(0).shallow().text()).toEqual('Installation Error (1 namespace failed, 1 namespace pending, 1 namespace installed)');
  });

  it('renders success state if all `ClusterServiceVersions` statuses are `Succeeded`', () => {
    clusterServiceVersions = [_.cloneDeep(testAppType), _.cloneDeep(testAppType), _.cloneDeep(testAppType)];

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.childAt(1);

    expect(col.childAt(0).childAt(0).shallow().text()).toEqual(`Installed (${clusterServiceVersions.length} namespaces)`);
  });

  it('renders error progress bar in expanded state if at least one `ClusterServiceVersion` status is `Failed`', () => {
    clusterServiceVersions = [_.cloneDeep(testAppType), _.cloneDeep(testAppType), _.cloneDeep(testAppType)];
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhaseFailed, reason: CSVConditionReason.CSVReasonComponentFailed};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.childAt(1);
    const progressBar = col.childAt(1).childAt(0).shallow().find('.co-catalog-install-progress-bar--failures');

    expect(progressBar.exists()).toBe(true);
  });

  it('renders active progress bar in expanded state if at least one `ClusterServiceVersion` status is `Pending` or `Installing`', () => {
    clusterServiceVersions = [_.cloneDeep(testAppType), _.cloneDeep(testAppType), _.cloneDeep(testAppType)];
    clusterServiceVersions[1].status = {phase: ClusterServiceVersionPhase.CSVPhasePending, reason: CSVConditionReason.CSVReasonRequirementsNotMet};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.childAt(1);
    const progressBar = col.childAt(1).childAt(0).shallow().find('.co-catalog-install-progress-bar--active');

    expect(progressBar.exists()).toBe(true);
  });

  it('does not render progress bar in expanded state if all `ClusterServiceVersion` status are `Succeeded`', () => {
    clusterServiceVersions = [_.cloneDeep(testAppType), _.cloneDeep(testAppType), _.cloneDeep(testAppType)];

    wrapper.setProps({clusterServiceVersions});
    wrapper.setState({expand: true});
    const col = wrapper.childAt(1);
    const progressBar = col.childAt(1).childAt(0).shallow().find('.co-catalog-install-progress-bar--active');

    expect(progressBar.exists()).toBe(false);
  });

  it('renders list of namespace statuses in correct priority order in expanded state', () => {
    clusterServiceVersions = [_.cloneDeep(testAppType), _.cloneDeep(testAppType), _.cloneDeep(testAppType)];
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhaseFailed, reason: CSVConditionReason.CSVReasonComponentFailed};
    clusterServiceVersions[1].status = {phase: ClusterServiceVersionPhase.CSVPhasePending, reason: CSVConditionReason.CSVReasonRequirementsNotMet};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.childAt(1);
    const namespaceList = col.childAt(1).childAt(0).shallow().find('ul').find('li');

    expect(namespaceList.length).toEqual(clusterServiceVersions.length);
    expect(namespaceList.at(0).text()).toContain(clusterServiceVersions[0].metadata.namespace);
    expect(namespaceList.at(1).text()).toContain(clusterServiceVersions[1].metadata.namespace);
    expect(namespaceList.at(2).text()).toContain(clusterServiceVersions[2].metadata.namespace);
  });

  it('renders status reason next to failed namespaces', () => {
    clusterServiceVersions = [_.cloneDeep(testAppType)];
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhaseFailed, reason: CSVConditionReason.CSVReasonComponentFailed};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.childAt(1);
    const namespaceList = col.childAt(1).childAt(0).shallow().find('ul').find('li');

    namespaceList.forEach((item, i) => {
      expect(item.text()).toEqual(`${clusterServiceVersions[i].metadata.namespace}: ${clusterServiceVersions[i].status.reason}`);
    });
  });

  it('shows collapsed row by default', () => {
    const col = wrapper.childAt(1);

    expect(col.children().length).toEqual(1);
  });

  it('shows expanded state if at least one `ClusterServiceVersion` status is not `Succeeded`', () => {
    clusterServiceVersions = [_.cloneDeep(testAppType), _.cloneDeep(testAppType), _.cloneDeep(testAppType)];
    clusterServiceVersions[0].status = {phase: ClusterServiceVersionPhase.CSVPhaseFailed, reason: CSVConditionReason.CSVReasonComponentFailed};
    clusterServiceVersions[1].status = {phase: ClusterServiceVersionPhase.CSVPhasePending, reason: CSVConditionReason.CSVReasonRequirementsNotMet};

    wrapper.setProps({clusterServiceVersions});
    const col = wrapper.childAt(1);

    expect(col.childAt(2).exists()).toBe(true);
  });

  it('renders column for actions', () => {
    const col = wrapper.childAt(2);
    const button: ShallowWrapper<any> = col.find('button.btn-primary');

    expect(button.exists()).toBe(true);
  });
});

describe(CatalogAppHeader.name, () => {
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

    expect(colHeader.childAt(0).text()).toEqual('Actions');
  });
});

describe(CatalogAppList.name, () => {
  let wrapper: ShallowWrapper<CatalogAppListProps>;

  beforeEach(() => {
    wrapper = shallow(<CatalogAppList data={[]} loaded={true} filters={{}} />);
  });

  it('renders a `List` with the correct header and row components', () => {
    const list: ShallowWrapper<any> = wrapper.find(List);

    expect(list.props().Header).toEqual(CatalogAppHeader);
    expect(list.props().Row).toEqual(CatalogAppRow);
    expect(list.props().isList).toBe(true);
    expect(list.props().label).toEqual('Applications');
  });
});

describe(CatalogAppsPage.name, () => {
  let wrapper: ShallowWrapper;

  beforeEach(() => {
    wrapper = shallow(<CatalogAppsPage />);
  });

  it('renders a `ListPage` with the correct props', () => {
    const listPage = wrapper.find(ListPage);

    expect(listPage.exists()).toBe(true);
    expect(listPage.props().kind).toEqual('AlphaCatalogEntry-v1');
    expect(listPage.props().ListComponent).toEqual(CatalogAppList);
    expect(listPage.props().filterLabel).toEqual('Applications by name');
    expect(listPage.props().title).toEqual('Applications');
    expect(listPage.props().showTitle).toBe(true);
  });
});

describe(CatalogDetails.name, () => {
  let wrapper: ShallowWrapper<CatalogDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(<CatalogDetails />);
  });

  it('renders info section', () => {
    const section = wrapper.find('.co-m-pane__body');
    const name = wrapper.findWhere(node => node.equals(<dt>Name</dt>)).parent().find('dd');
    const provider = wrapper.findWhere(node => node.equals(<dt>Provider</dt>)).parent().find('dd');

    expect(section.exists()).toBe(true);
    expect(name.text()).toEqual('Open Cloud Services');
    expect(provider.text()).toEqual('CoreOS, Inc');
  });

  it('renders section with list of available applications from the catalog', () => {
    const section = wrapper.find('.co-m-pane__body-section--bordered');

    expect(section.find(CatalogAppsPage).exists()).toBe(true);
  });
});

describe(CatalogsDetailsPage.name, () => {
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
