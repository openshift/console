import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line no-undef
import Spy = jasmine.Spy;
/* eslint-disable no-unused-vars */
import { ShallowWrapper, shallow } from 'enzyme';

import { EnableApplicationModal, EnableApplicationModalProps, SelectNamespaceHeader, SelectNamespaceHeaderProps, SelectNamespaceRow, SelectNamespaceRowProps } from '../../../public/components/modals/enable-application-modal';
import { ListHeader, ColHead, List, ResourceRow } from '../../../public/components/factory';
import { ResourceIcon } from '../../../public/components/utils';
import { ModalBody, ModalTitle, ModalSubmitFooter } from '../../../public/components/factory/modal';
import { testSubscription, testCatalogEntry } from '../../../__mocks__/k8sResourcesMocks';
import { ClusterServiceVersionLogo, SubscriptionKind } from '../../../public/components/cloud-services';
import { SubscriptionModel } from '../../../public/models';
import { K8sResourceKind } from '../../../public/module/k8s';
/* eslint-enable no-unused-vars */


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
  let namespace: K8sResourceKind;
  let onSelect: Spy;
  let onDeselect: Spy;

  beforeEach(() => {
    const annotations = {
      'alm-manager': 'foobar',
    };

    onSelect = jasmine.createSpy('onSelect');
    onDeselect = jasmine.createSpy('onDeselect');
    namespace = {apiVersion: 'v1', kind: 'Namespace', metadata: {name: 'default', namespace: 'default', uid: 'abcd', labels: {}, annotations: annotations}};
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
    expect(col.text()).toEqual('Not enabled');
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

describe(EnableApplicationModal.name, () => {
  let wrapper: ShallowWrapper<EnableApplicationModalProps, any>;
  let namespaces: EnableApplicationModalProps['namespaces'];
  let subscriptions: SubscriptionKind[];
  let k8sCreate: Spy;
  let close: Spy;
  let cancel: Spy;

  beforeEach(() => {
    k8sCreate = jasmine.createSpy('k8sCreate');
    close = jasmine.createSpy('close');
    cancel = jasmine.createSpy('cancel');
    subscriptions = [_.cloneDeep(testSubscription)];
    namespaces = {
      data: {
        'default': {metadata: {name: 'default', labels: {}}},
        'other-ns': {metadata: {name: 'other-ns', labels: {}, annotations: {'alm-manager': 'foo'}}},
      },
      loaded: true,
      loadError: '',
    };

    wrapper = shallow(<EnableApplicationModal catalogEntry={testCatalogEntry} namespaces={namespaces} subscriptions={subscriptions} k8sCreate={k8sCreate} close={close} cancel={cancel} />);
  });

  it('renders a modal form', () => {
    expect(wrapper.find('form').props().name).toEqual('form');
    expect(wrapper.find(ModalTitle).exists()).toBe(true);
    expect(wrapper.find(ModalBody).find('.modal-body__field').text()).toEqual('Select the deployable namespaces where you want to make the application available.');
    expect(wrapper.find(ModalSubmitFooter).props().submitText).toEqual('Enable');
  });

  it('renders application logo in modal title', () => {
    const logo = wrapper.find(ModalTitle).find(ClusterServiceVersionLogo);

    expect(logo.exists()).toBe(true);
    expect(logo.props().displayName).toEqual(testCatalogEntry.spec.spec.displayName);
    expect(logo.props().provider).toEqual(testCatalogEntry.spec.spec.provider);
    expect(logo.props().icon).toEqual(testCatalogEntry.spec.spec.icon[0]);
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

  it('calls `props.k8sCreate` to create subscription for each selected namespace when form is submitted', (done) => {
    const selectedNamespaces = [namespaces.data.default.metadata.name];
    wrapper = wrapper.setState({selectedNamespaces});

    close.and.callFake(() => {
      expect(k8sCreate.calls.count()).toEqual(selectedNamespaces.length);
      selectedNamespaces.forEach((namespace, i) => {
        expect(k8sCreate.calls.argsFor(i)[0]).toEqual(SubscriptionModel);
        expect(k8sCreate.calls.argsFor(i)[1]).toEqual({
          apiVersion: 'app.coreos.com/v1alpha1',
          kind: SubscriptionModel.kind,
          metadata: {
            generateName: 'testapp-',
            namespace,
          },
          spec: {
            source: 'tectonic-ocs',
            name: 'testapp-package',
            channel: 'stable',
            currentCSV: 'testapp',
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
