/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;
import * as _ from 'lodash';

import { InstallApplicationModal, InstallApplicationModalProps, SelectNamespaceHeader, SelectNamespaceHeaderProps, SelectNamespaceRow, SelectNamespaceRowProps } from '../../../public/components/modals/install-application-modal';
import { ListHeader, ColHead, List } from '../../../public/components/factory';
import { ResourceLink } from '../../../public/components/utils';
import { ModalBody, ModalTitle, ModalSubmitFooter } from '../../../public/components/factory/modal';
import { k8sKinds } from '../../../public/module/k8s';
import { testClusterServiceVersion, testCatalogApp } from '../../../__mocks__/k8sResourcesMocks';
import { ClusterServiceVersionLogo, ClusterServiceVersionKind, InstallPlanApproval } from '../../../public/components/cloud-services';

describe('SelectNamespaceHeader', () => {
  let wrapper: ShallowWrapper<SelectNamespaceHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<SelectNamespaceHeader />);
  });

  it('renders column header for namespace name', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(0);

    expect(colHeader.props().sortField).toEqual('metadata.name');
    expect(colHeader.childAt(0).text()).toEqual('Name');
  });

  it('renders a column header for namespace install status', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(1);

    expect(colHeader.childAt(0).text()).toEqual('Status');
  });
});

describe('SelectNamespaceRow', () => {
  let wrapper: ShallowWrapper<SelectNamespaceRowProps>;
  let namespace: {metadata: {name: string, namespace: string, uid: string, annotations: {[key: string]: string}, labels: {[key: string]: string}}};
  let onSelect: Spy;
  let onDeselect: Spy;

  beforeEach(() => {
    const annotations = {
      'alm-manager': 'foobar',
    };

    onSelect = jasmine.createSpy('onSelect');
    onDeselect = jasmine.createSpy('onDeselect');
    namespace = {metadata: {name: 'default', namespace: 'default', uid: 'abcd', labels: {}, annotations: annotations}};
    wrapper = shallow(<SelectNamespaceRow obj={namespace} selected={false} onDeselect={onDeselect} onSelect={onSelect} />);
  });

  it('renders column with checkbox', () => {
    const col = wrapper.childAt(0);
    const checkbox = col.find('input');

    expect(checkbox.props().type).toEqual('checkbox');
    expect(checkbox.props().value).toEqual(namespace.metadata.name);
    expect(checkbox.props().checked).toEqual(false);
    expect(checkbox.props().disabled).toEqual(false);
    expect(col.find('.fa-check').exists()).toBe(false);
  });

  it('renders column with checkbox that is disabled when OCS is not enabled', () => {
    namespace.metadata.annotations = {};
    wrapper.setProps({obj: namespace});

    const col = wrapper.childAt(0);
    const checkbox = col.find('input');

    expect(checkbox.props().type).toEqual('checkbox');
    expect(checkbox.props().value).toEqual(namespace.metadata.name);
    expect(checkbox.props().checked).toEqual(false);
    expect(checkbox.props().disabled).toEqual(true);
    expect(col.find('.fa-check').exists()).toBe(false);
  });

  it('renders column for namespace name', () => {
    const col = wrapper.childAt(0);
    const link = col.find(ResourceLink);

    expect(link.props().kind).toEqual('Namespace');
    expect(link.props().name).toEqual(namespace.metadata.name);
    expect(link.props().namespace).toEqual(namespace.metadata.namespace);
    expect(link.props().title).toEqual(namespace.metadata.uid);
  });

  it('renders column for namespace install status when OCS is enabled', () => {
    const col = wrapper.childAt(1);
    expect(col.text()).toEqual('Not installed');
  });

  it('renders column for namespace install status when OCS is not enabled', () => {
    namespace.metadata.annotations = {};
    wrapper.setProps({obj: namespace});
    const col = wrapper.childAt(1);
    expect(col.text()).toEqual('OCS not enabled');
  });

  it('calls `props.onSelect` when checkbox is clicked and not checked', () => {
    wrapper.find('input').simulate('change');

    expect(onSelect).toHaveBeenCalled();
    expect(onDeselect).not.toHaveBeenCalled();
  });

  it('calls `props.onDeselect` when checkbox is clicked and already checked', () => {
    wrapper.setProps({selected: true});
    wrapper.find('input').simulate('change');

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDeselect).toHaveBeenCalled();
  });
});

describe('InstallApplicationModal', () => {
  let wrapper: ShallowWrapper<InstallApplicationModalProps, any>;
  let namespaces: InstallApplicationModalProps['namespaces'];
  let clusterServiceVersions: ClusterServiceVersionKind[];
  let watchK8sList: Spy;
  let k8sCreate: Spy;
  let close: Spy;
  let cancel: Spy;

  beforeEach(() => {
    watchK8sList = jasmine.createSpy('watchK8sList');
    k8sCreate = jasmine.createSpy('k8sCreate');
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion)];
    namespaces = {
      data: {
        'default': {metadata: {name: 'default', labels: {}}},
        'other-ns': {metadata: {name: 'other-ns', labels: {}}},
      },
      loaded: true,
      loadError: '',
    };

    wrapper = shallow(<InstallApplicationModal catalogEntry={testCatalogApp} namespaces={namespaces} clusterServiceVersions={clusterServiceVersions} k8sCreate={k8sCreate} watchK8sList={watchK8sList} close={close} cancel={cancel} />);
  });

  it('renders a modal form', () => {
    expect(wrapper.find('form').props().name).toEqual('form');
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalBody).find('.modal-body__field').text()).toEqual('Select the namespaces where you want to install and run the application.');
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('Save Changes');
  });

  it('renders application logo in modal title', () => {
    const logo = wrapper.find(ModalTitle).find(ClusterServiceVersionLogo);

    expect(logo.exists()).toBe(true);
    expect(logo.props().displayName).toEqual(testCatalogApp.spec.displayName);
    expect(logo.props().provider).toEqual(testCatalogApp.spec.provider);
    expect(logo.props().icon).toEqual(testCatalogApp.spec.icon[0]);
  });

  it('renders a list of only available namespaces', () => {
    const availableNamespaces = [namespaces.data['other-ns']];

    const list: ShallowWrapper<any> = wrapper.find(ModalBody).find(List);
    const Row = list.props().Row;
    const row = shallow(<Row obj={namespaces.data.default} />).find(SelectNamespaceRow);

    expect(list.props().loaded).toEqual(namespaces.loaded);
    expect(list.props().loadError).toEqual(namespaces.loadError);
    expect(list.props().data).toEqual(availableNamespaces);
    expect(list.props().Header).toEqual(SelectNamespaceHeader);
    expect(row.props().obj).toEqual(namespaces.data.default);
    expect(row.props().selected).toBe(false);
  });

  it('calls `props.k8sCreate` for each selected namespace when form is submitted', (done) => {
    const selectedNamespaces = [namespaces.data.default.metadata.name];
    // FIXME(alecmerdler): `setState` isn't updating state for some reason, this is hacky
    wrapper.instance().state.selectedNamespaces = selectedNamespaces;

    close.and.callFake(() => {
      selectedNamespaces.forEach((namespace, i) => {
        expect(k8sCreate.calls.argsFor(i)[0]).toEqual(k8sKinds['InstallPlan-v1']);
        expect(k8sCreate.calls.argsFor(i)[1]).toEqual({
          apiVersion: 'app.coreos.com/v1alpha1',
          kind: 'InstallPlan-v1',
          metadata: {
            generateName: `${testClusterServiceVersion.metadata.name}-`,
            namespace,
          },
          spec: {
            clusterServiceVersionNames: [testClusterServiceVersion.metadata.name],
            approval: InstallPlanApproval.Automatic,
          },
        });
      });
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('calls `props.close` after successful submit', (done) => {
    close.and.callFake(() => {
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });
});
