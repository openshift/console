import * as React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import { Alert, DataList, DataListCheck } from '@patternfly/react-core';
import store from '@console/internal/redux';

import {
  ColumnManagementModal,
  MAX_VIEW_COLS,
} from '@console/internal/components/modals/column-management-modal';
import { referenceForModel } from '@console/internal/module/k8s';
import { PodModel } from '@console/internal/models';

const columnManagementID = referenceForModel(PodModel);
const columnManagementType = 'Pod';
const selectedColumns = [
  {
    title: 'Name',
    visible: true,
    id: 'name',
  },
  {
    title: 'Namespace',
    visible: true,
    id: 'namespace',
  },
  {
    title: 'Status',
    visible: true,
    id: 'status',
  },
  {
    title: 'Ready',
    visible: true,
    id: 'ready',
  },
  {
    title: 'Restarts',
    visible: true,
    id: 'restarts',
  },
  {
    title: 'Owner',
    visible: true,
    id: 'owner',
  },
  {
    title: 'Memory',
    visible: true,
    id: 'memory',
  },
  {
    title: 'CPU',
    visible: true,
    id: 'cpu',
  },
  {
    title: 'Created',
    visible: true,
    id: 'created',
  },
  {
    title: 'Node',
    visible: false,
    additional: true,
    id: 'node',
  },
  {
    title: 'Labels',
    visible: false,
    additional: true,
    id: 'labels',
  },
  {
    title: 'IP Address',
    visible: false,
    additional: true,
    id: 'ipaddress',
  },
  {
    title: '',
    visible: true,
  },
];

const selectedColumnsNamespaceDisabled = [
  {
    title: 'Name',
    visible: true,
    id: 'name',
  },
  {
    title: 'Namespace',
    visible: false,
    id: 'namespace',
  },
  {
    title: 'Status',
    visible: true,
    id: 'status',
  },
  {
    title: 'Ready',
    visible: true,
    id: 'ready',
  },
  {
    title: 'Restarts',
    visible: true,
    id: 'restarts',
  },
  {
    title: 'Owner',
    visible: true,
    id: 'owner',
  },
  {
    title: 'Memory',
    visible: true,
    id: 'memory',
  },
  {
    title: 'CPU',
    visible: true,
    id: 'cpu',
  },
  {
    title: 'Created',
    visible: true,
    id: 'created',
  },
  {
    title: 'Node',
    visible: false,
    additional: true,
    id: 'node',
  },
  {
    title: 'Labels',
    visible: false,
    additional: true,
    id: 'labels',
  },
  {
    title: 'IP Address',
    visible: false,
    additional: true,
    id: 'ipaddress',
  },
  {
    title: '',
    visible: true,
  },
];

describe(ColumnManagementModal.displayName, () => {
  let wrapper;
  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <ColumnManagementModal
          columnManagementType={columnManagementType}
          columnManagementID={columnManagementID}
          selectedColumns={selectedColumns}
        />
      </Provider>,
    );
  });
  it('renders max row info alert', () => {
    expect(wrapper.find(Alert).props().variant).toEqual('info');
    expect(wrapper.find(Alert).props().title).toEqual(
      `You can select up to ${MAX_VIEW_COLS} columns`,
    );
  });

  it('renders two data lists', () => {
    expect(wrapper.find(DataList).length).toEqual(2);
  });

  it('renders 12 checkboxes with name, and last 3 disabled', () => {
    const checkboxItems = wrapper.find(DataListCheck);
    expect(checkboxItems.length).toEqual(12);
    expect(checkboxItems.at(0).props().isDisabled).toEqual(true); // namespace is always disabled
    expect(checkboxItems.at(1).props().isDisabled).toEqual(false); // all default columns should be enabled
    expect(checkboxItems.at(8).props().isDisabled).toEqual(false); // all default columns should be enabled
    expect(checkboxItems.at(9).props().isDisabled).toEqual(true); // all additional columns should be disabled
    expect(checkboxItems.at(11).props().isDisabled).toEqual(true); // all additional columns should be disabled
  });

  it('renders a single disabled checkbox when under MAX columns', () => {
    wrapper = mount(
      <Provider store={store}>
        <ColumnManagementModal
          columnManagementType={columnManagementType}
          columnManagementID={columnManagementID}
          selectedColumns={selectedColumnsNamespaceDisabled}
        />
      </Provider>,
    );
    const checkboxItems = wrapper.find(DataListCheck);
    expect(checkboxItems.length).toEqual(12);
    expect(checkboxItems.at(0).props().isDisabled).toEqual(true);
    expect(checkboxItems.at(1).props().isDisabled).toEqual(false);
    expect(checkboxItems.at(8).props().isDisabled).toEqual(false);
    expect(checkboxItems.at(9).props().isDisabled).toEqual(false);
    expect(checkboxItems.at(11).props().isDisabled).toEqual(false);
  });
});
