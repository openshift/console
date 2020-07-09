import * as React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import { Alert, DataList, DataListCheck } from '@patternfly/react-core';
import store from '@console/internal/redux';

import {
  ColumnManagementModal,
  MAX_VIEW_COLS,
} from '@console/internal/components/modals/column-management-modal';

const kinds = ['pod'];
const columnFilters = [
  {
    title: 'Name',
    visible: true,
  },
  {
    title: 'Namespace',
    visible: true,
  },
  {
    title: 'Status',
    visible: true,
  },
  {
    title: 'Ready',
    visible: true,
  },
  {
    title: 'Restarts',
    visible: true,
  },
  {
    title: 'Node',
    visible: true,
  },
  {
    title: 'Memory',
    visible: true,
  },
  {
    title: 'CPU',
    visible: true,
  },
  {
    title: 'Created',
    visible: true,
  },
  {
    title: 'Node',
    visible: false,
    additional: true,
  },
  {
    title: 'Labels',
    visible: false,
    additional: true,
  },
  {
    title: 'IP Address',
    visible: false,
    additional: true,
  },
  {
    title: '',
    visible: true,
  },
];

const columnFiltersNamespaceDisabled = [
  {
    title: 'Name',
    visible: true,
  },
  {
    title: 'Namespace',
    visible: false,
  },
  {
    title: 'Status',
    visible: true,
  },
  {
    title: 'Ready',
    visible: true,
  },
  {
    title: 'Restarts',
    visible: true,
  },
  {
    title: 'Node',
    visible: true,
  },
  {
    title: 'Memory',
    visible: true,
  },
  {
    title: 'CPU',
    visible: true,
  },
  {
    title: 'Created',
    visible: true,
  },
  {
    title: 'Node',
    visible: false,
    additional: true,
  },
  {
    title: 'Labels',
    visible: false,
    additional: true,
  },
  {
    title: 'IP Address',
    visible: false,
    additional: true,
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
        <ColumnManagementModal kinds={kinds} columnFilters={columnFilters} />
      </Provider>,
    );
  });
  it('renders max row info alert', () => {
    expect(wrapper.find(Alert).props().variant).toEqual('info');
    expect(wrapper.find(Alert).props().title).toEqual(
      `You can select up to ${MAX_VIEW_COLS - 1} columns`,
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
        <ColumnManagementModal kinds={kinds} columnFilters={columnFiltersNamespaceDisabled} />
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
