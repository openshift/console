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
const columnLayout = [
  {
    title: 'Name',
    id: 'name',
  },
  {
    title: 'Namespace',
    id: 'namespace',
  },
  {
    title: 'Status',
    id: 'status',
  },
  {
    title: 'Ready',
    id: 'ready',
  },
  {
    title: 'Restarts',
    id: 'restarts',
  },
  {
    title: 'Owner',
    id: 'owner',
  },
  {
    title: 'Memory',
    id: 'memory',
  },
  {
    title: 'CPU',
    id: 'cpu',
  },
  {
    title: 'Created',
    id: 'created',
  },
  {
    title: 'Node',
    additional: true,
    id: 'node',
  },
  {
    title: 'Labels',
    additional: true,
    id: 'labels',
  },
  {
    title: 'IP Address',
    additional: true,
    id: 'ipaddress',
  },
  {
    title: '',
  },
];

const columnLayoutNamespaceDisabled = [
  {
    title: 'Name',
    id: 'name',
  },
  {
    title: 'Namespace',
    id: 'namespace',
  },
  {
    title: 'Status',
    id: 'status',
  },
  {
    title: 'Ready',
    id: 'ready',
  },
  {
    title: 'Restarts',
    id: 'restarts',
  },
  {
    title: 'Owner',
    id: 'owner',
  },
  {
    title: 'Memory',
    id: 'memory',
  },
  {
    title: 'CPU',
    id: 'cpu',
  },
  {
    title: 'Created',
    id: 'created',
  },
  {
    title: 'Node',
    additional: true,
    id: 'node',
  },
  {
    title: 'Labels',
    additional: true,
    id: 'labels',
  },
  {
    title: 'IP Address',
    additional: true,
    id: 'ipaddress',
  },
  {
    title: '',
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
          selectedColumns={
            new Set(
              columnLayout.reduce((acc, column) => {
                if (column.id && !column.additional) {
                  acc.push(column.id);
                }
                return acc;
              }, []),
            )
          }
          columnLayout={columnLayout}
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
          selectedColumns={
            new Set(
              columnLayoutNamespaceDisabled.reduce((acc, column) => {
                if (column.id && !column.additional && column.id !== 'cpu') {
                  acc.push(column.id);
                }
                return acc;
              }, []),
            )
          }
          columnLayout={columnLayoutNamespaceDisabled}
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
