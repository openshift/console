import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';

import {
  DetailsPage,
  ListPage,
  RowFunctionArgs,
  TableProps,
  Table,
} from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  ResourceLink,
  ResourceKebab,
  PageComponentProps,
} from '@console/internal/components/utils';
import { Status } from '@console/shared';

import {
  VolumeSnapshotDetails,
  VolumeSnapshotPage,
  VolumeSnapshotList,
  VolumeSnapshotTableHeader,
  VolumeSnapshotTableRow,
  DetailsComponent,
} from '../components/volume-snapshot/volume-snapshot';

import { DeleteSnapshot } from '../utils/delete-snapshot-workflow';
import { RestorePVC } from '../utils/restore-pvc-workflow';
import { snapshotData, pvcData } from '../__mocks__/volume-snapshot-data';

describe('<VolumeSnapshotList>', () => {
  let wrapper: ShallowWrapper<TableProps>;
  let rowArgs: RowFunctionArgs<K8sResourceKind>;

  beforeEach(() => {
    wrapper = shallow(
      <VolumeSnapshotList
        aria-label="Volume Snapshot"
        data={snapshotData.items}
        Header={VolumeSnapshotTableHeader}
        Row={VolumeSnapshotTableRow}
      />,
    );
    rowArgs = {
      obj: snapshotData.items[0],
      index: 1,
      key: '1',
      style: {},
    } as any;
  });

  it('renders `Table` with correct props', () => {
    expect(wrapper.find(Table).exists()).toBe(true);
  });

  it('should render the proper Headers in the Resources tab', () => {
    const expectedHeader: string[] = ['Name', 'Date', 'Status', 'Size'];

    const headers = wrapper
      .find(Table)
      .props()
      .Header();

    expectedHeader.forEach((header, i) => {
      expect(headers[i].title).toBe(header);
    });
  });

  it('should render the TableRow component', () => {
    const volumeSnapshotTableRow = shallow(VolumeSnapshotTableRow(rowArgs));
    expect(volumeSnapshotTableRow.find('tr').exists()).toBe(true);
  });

  it('should render the number of snapshots deployed for resources that support it', () => {
    const volumeSnapshotTableRow = shallow(VolumeSnapshotTableRow(rowArgs));
    expect(volumeSnapshotTableRow.find(Status).exists()).toBe(true);
    expect(volumeSnapshotTableRow.find(Status).props().status).toBe('Ready');

    expect(volumeSnapshotTableRow.find(ResourceLink).exists()).toBe(true);
    expect(volumeSnapshotTableRow.find(ResourceLink).props().title).toEqual('fakeSnapshot');

    expect(volumeSnapshotTableRow.find(ResourceKebab).exists()).toBe(true);
    expect(volumeSnapshotTableRow.find(ResourceKebab).props().actions).toEqual([
      RestorePVC,
      DeleteSnapshot,
    ]);
  });
});

describe('<VolumeSnapshotPage>', () => {
  let wrapper: ShallowWrapper<PageComponentProps>;

  beforeEach(() => {
    wrapper = shallow(
      <VolumeSnapshotPage
        match={{
          url: '/k8s/ns/default/kind/example',
          path: '/k8s/ns/:ns/:plural/:name',
          isExact: true,
          params: {},
        }}
        obj={pvcData.data}
      />,
    );
  });

  it('renders `ListPage` with correct props', () => {
    expect(wrapper.find(ListPage).exists()).toBe(true);
  });
});

describe('<VolumeSnapshotDetails>', () => {
  let wrapper: ShallowWrapper<any>;
  const detailArgs = {
    obj: snapshotData.items[0],
  } as any;

  beforeEach(() => {
    wrapper = shallow(
      <VolumeSnapshotDetails
        match={{
          url: '/k8s/ns/default/kind/example',
          path: '/k8s/ns/:ns/:plural/:name',
          isExact: true,
          params: {
            ns: 'fakes',
          },
        }}
        kind="VolumeSnapshotModel"
      />,
    );
  });

  it('renders `DetailsPage` with correct props', () => {
    const detailsWrapper = wrapper.find(DetailsPage);
    expect(detailsWrapper.exists()).toBe(true);
  });

  it('should render `DetailsPage` Component with proper page tabs', () => {
    expect(
      wrapper
        .find(DetailsPage)
        .props()
        .pages.map((p) => p.name),
    ).toEqual(['Details']);
  });

  it('should render the Details component', () => {
    const detailsWrapper = wrapper.find(DetailsPage);
    expect(detailsWrapper.props().pages[0].component).toEqual(DetailsComponent);
    expect(DetailsComponent(detailArgs)).toMatchSnapshot();
  });

  it('should render the details action menu', () => {
    const detailsWrapper = wrapper.find(DetailsPage);
    expect(detailsWrapper.props().menuActions).toEqual([RestorePVC, DeleteSnapshot]);
  });

  it('should render the breadcrumbs', () => {
    const detailsWrapper = wrapper.find(DetailsPage);
    expect(detailsWrapper.props().breadcrumbsFor(snapshotData.items[0])).toEqual(
      snapshotData.breadcrumbs,
    );
  });
});
