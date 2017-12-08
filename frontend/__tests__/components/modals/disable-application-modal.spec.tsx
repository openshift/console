/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;
import * as _ from 'lodash';

import { DisableApplicationModal, DisableApplicationModalProps, SelectNamespaceHeader, SelectNamespaceHeaderProps, SelectNamespaceRow, SelectNamespaceRowProps } from '../../../public/components/modals/disable-application-modal';
import { ListHeader, ColHead, List, ResourceRow } from '../../../public/components/factory';
import { ResourceIcon } from '../../../public/components/utils';
import { ModalBody, ModalTitle, ModalSubmitFooter } from '../../../public/components/factory/modal';
import { testClusterServiceVersion, testCatalogApp } from '../../../__mocks__/k8sResourcesMocks';
import { ClusterServiceVersionLogo, ClusterServiceVersionKind } from '../../../public/components/cloud-services';
import { ClusterServiceVersionModel } from '../../../public/models';

describe(SelectNamespaceHeader.displayName, () => {
  let wrapper: ShallowWrapper<SelectNamespaceHeaderProps>;

  beforeEach(() => {
    wrapper = shallow(<SelectNamespaceHeader />);
  });

  it('renders column header for namespace name', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(0);

    expect(colHeader.props().sortField).toEqual('metadata.name');
    expect(colHeader.childAt(0).text()).toEqual('Name');
  });

  it('renders a column header for namespace enabled status', () => {
    const colHeader = wrapper.find(ListHeader).find(ColHead).at(1);

    expect(colHeader.childAt(0).text()).toEqual('Status');
  });
});

describe(SelectNamespaceRow.displayName, () => {
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
    const col = wrapper.find(ResourceRow).childAt(0);
    const checkbox = col.find('input');

    expect(checkbox.props().type).toEqual('checkbox');
    expect(checkbox.props().value).toEqual(namespace.metadata.name);
    expect(checkbox.props().checked).toEqual(false);
    expect(col.find('.fa-check').exists()).toBe(false);
  });

  it('renders column for namespace name', () => {
    const col = wrapper.find(ResourceRow).childAt(0);
    const icon = col.find(ResourceIcon);
    expect(icon.exists()).toEqual(true);
    expect(icon.props().kind).toEqual('Namespace');

    const nameSpan = col.find('span');
    expect(nameSpan.exists()).toEqual(true);
    expect(nameSpan.text()).toEqual('default');
  });

  it('renders column for namespace enabled status', () => {
    const col = wrapper.find(ResourceRow).childAt(1);
    expect(col.text()).toEqual('Enabled');
  });

  it('calls `props.onSelect` when checkbox is clicked and not checked', () => {
    wrapper.find(ResourceRow).find('input').simulate('change');

    expect(onSelect).toHaveBeenCalled();
    expect(onDeselect).not.toHaveBeenCalled();
  });

  it('calls `props.onDeselect` when checkbox is clicked and already checked', () => {
    wrapper.setProps({selected: true});
    wrapper.find(ResourceRow).find('input').simulate('change');

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDeselect).toHaveBeenCalled();
  });
});

describe(DisableApplicationModal.name, () => {
  let wrapper: ShallowWrapper<DisableApplicationModalProps, any>;
  let namespaces: DisableApplicationModalProps['namespaces'];
  let clusterServiceVersions: ClusterServiceVersionKind[];
  let k8sKill: Spy;
  let close: Spy;
  let cancel: Spy;

  beforeEach(() => {
    k8sKill = jasmine.createSpy('k8sKill');
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');
    clusterServiceVersions = [_.cloneDeep(testClusterServiceVersion)];
    namespaces = {
      data: {
        'default': {metadata: {name: 'default', labels: {}}},
        'other-ns': {metadata: {name: 'other-ns', labels: {}, annotations: {'alm-manager': 'foo'}}},
        [testClusterServiceVersion.metadata.namespace]: {metadata: {name: testClusterServiceVersion.metadata.namespace, labels: {}, annotations: {'alm-manager': 'foo'}},}
      },
      loaded: true,
      loadError: '',
    };

    wrapper = shallow(<DisableApplicationModal catalogEntry={testCatalogApp} namespaces={namespaces} clusterServiceVersions={clusterServiceVersions} k8sKill={k8sKill} close={close} cancel={cancel} />, {lifecycleExperimental: true});
  });

  it('renders a modal form', () => {
    expect(wrapper.find('form').props().name).toEqual('form');
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalBody).find('.modal-body__field').text()).toEqual('Select the namespaces where you want to disable the service.');
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('Disable');
  });

  it('renders application logo in modal title', () => {
    const logo = wrapper.find(ModalTitle).find(ClusterServiceVersionLogo);

    expect(logo.exists()).toBe(true);
    expect(logo.props().displayName).toEqual(testCatalogApp.spec.displayName);
    expect(logo.props().provider).toEqual(testCatalogApp.spec.provider);
    expect(logo.props().icon).toEqual(testCatalogApp.spec.icon[0]);
  });

  it('renders a list of only available namespaces', () => {
    const availableNamespaces = [namespaces.data[testClusterServiceVersion.metadata.namespace]];

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

  it('renders checkbox for setting cascading delete', () => {
    expect(wrapper.find('.co-delete-modal-checkbox-label').find('input').props().checked).toBe(true);
    expect(wrapper.find('.co-delete-modal-checkbox-label').text()).toContain('Completely remove application instances and resources from every selected namespace');
  });

  it('calls `props.k8sKill` for each selected namespace when form is submitted', (done) => {
    const selectedNamespaces = [namespaces.data[testClusterServiceVersion.metadata.namespace]];
    const csvForNamespace = (namespace: string) => clusterServiceVersions.find(({metadata}) => metadata.namespace === namespace);
    wrapper = wrapper.setState({selectedNamespaces, cascadeDelete: false});

    close.and.callFake(() => {
      expect(k8sKill.calls.count()).toEqual(selectedNamespaces.length);
      selectedNamespaces.forEach((namespace, i) => {
        expect(k8sKill.calls.argsFor(i)[0]).toEqual(ClusterServiceVersionModel);
        expect(k8sKill.calls.argsFor(i)[1]).toEqual(csvForNamespace(namespace));
        expect(k8sKill.calls.argsFor(i)[2]).toEqual({});
        expect(k8sKill.calls.argsFor(i)[3]).toBe(null);
      });
      done();
    });

    wrapper.find('form').simulate('submit', new Event('submit'));
  });

  it('adds delete options with `propagationPolicy` if cascading delete checkbox is checked', (done) => {
    const selectedNamespaces = [namespaces.data[testClusterServiceVersion.metadata.namespace]];
    wrapper = wrapper.setState({selectedNamespaces, cascadeDelete: true});

    close.and.callFake(() => {
      selectedNamespaces.forEach((namespace, i) => {
        expect(k8sKill.calls.argsFor(i)[3]).toEqual({kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground'});
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
