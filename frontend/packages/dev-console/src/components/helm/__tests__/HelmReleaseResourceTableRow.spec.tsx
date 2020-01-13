import * as React from 'react';
import { shallow } from 'enzyme';
import { TableRow } from '@console/internal/components/factory';
import HelmReleaseResourceTableRow from '../HelmReleaseResourceTableRow';
import { tableColumnClasses } from '../HelmReleaseResourceTableHeader';

let helmReleaseResourceTableRowProps: React.ComponentProps<typeof HelmReleaseResourceTableRow>;

describe('HelmReleaseResourceTableRow', () => {
  helmReleaseResourceTableRowProps = {
    obj: {
      kind: 'Secret',
      metadata: {
        creationTimestamp: '2020-01-20T05:37:13Z',
        name: 'sh.helm.release.v1.helm-mysql.v1',
        namespace: 'deb',
        labels: {
          name: 'helm-mysql',
        },
      },
    },
    index: 1,
    style: {},
  };
  const helmReleaseResourcesTableRow = shallow(
    <HelmReleaseResourceTableRow {...helmReleaseResourceTableRowProps} />,
  );
  it('should render the TableRow component', () => {
    expect(helmReleaseResourcesTableRow.find(TableRow).exists()).toBe(true);
    expect(
      helmReleaseResourcesTableRow
        .find(TableRow)
        .childAt(0)
        .hasClass(tableColumnClasses.name),
    ).toBe(true);
    expect(
      helmReleaseResourcesTableRow
        .find(TableRow)
        .childAt(1)
        .hasClass(tableColumnClasses.kind),
    ).toBe(true);
    expect(
      helmReleaseResourcesTableRow
        .find(TableRow)
        .childAt(2)
        .hasClass(tableColumnClasses.status),
    ).toBe(true);
    expect(
      helmReleaseResourcesTableRow
        .find(TableRow)
        .childAt(3)
        .hasClass(tableColumnClasses.timestamp),
    ).toBe(true);
  });
});
