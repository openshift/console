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
    ID: 'NAME',
  },
  {
    title: 'Namespace',
    visible: true,
    ID: 'NAMESPACE',
  },
  {
    title: 'Status',
    visible: true,
    ID: 'STATUS',
  },
  {
    title: 'Ready',
    visible: true,
    ID: 'READY',
  },
  {
    title: 'Restarts',
    visible: true,
    ID: 'RESTARTS',
  },
  {
    title: 'Node',
    visible: true,
    ID: 'NODE',
  },
  {
    title: 'Memory',
    visible: true,
    ID: 'MEMORY',
  },
  {
    title: 'CPU',
    visible: true,
    ID: 'CPU',
  },
  {
    title: 'Created',
    visible: true,
    ID: 'CREATED',
  },
  {
    title: 'Node',
    visible: false,
    additional: true,
    ID: 'NODE',
  },
  {
    title: 'Labels',
    visible: false,
    additional: true,
    ID: 'LABELS',
  },
  {
    title: 'IP Address',
    visible: false,
    additional: true,
    ID: 'IP-ADDRESS',
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
    ID: 'NAME',
  },
  {
    title: 'Namespace',
    visible: false,
    ID: 'NAMESPACE',
  },
  {
    title: 'Status',
    visible: true,
    ID: 'STATUS',
  },
  {
    title: 'Ready',
    visible: true,
    ID: 'READY',
  },
  {
    title: 'Restarts',
    visible: true,
    ID: 'RESTARTS',
  },
  {
    title: 'Node',
    visible: true,
    ID: 'NODE',
  },
  {
    title: 'Memory',
    visible: true,
    ID: 'MEMORY',
  },
  {
    title: 'CPU',
    visible: true,
    ID: 'CPU',
  },
  {
    title: 'Created',
    visible: true,
    ID: 'CREATED',
  },
  {
    title: 'Node',
    visible: false,
    additional: true,
    ID: 'NODE',
  },
  {
    title: 'Labels',
    visible: false,
    additional: true,
    ID: 'LABELS',
  },
  {
    title: 'IP Address',
    visible: false,
    additional: true,
    ID: 'IP-ADDRESS',
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
