import * as React from 'react';
import { shallow } from 'enzyme';
import { Table } from '@console/internal/components/factory';
import HelmResourcesListComponent from '../HelmResourcesListComponent';
import HelmReleaseResourceTableHeader from '../HelmReleaseResourceTableHeader';
import HelmReleaseResourceTableRow from '../HelmReleaseResourceTableRow';

let helmResourcesListComponentProps: React.ComponentProps<typeof HelmResourcesListComponent>;

describe('HelmResourcesListComponent', () => {
  helmResourcesListComponentProps = {
    Header: HelmReleaseResourceTableHeader,
    Row: HelmReleaseResourceTableRow,
    'aria-label': 'Resources',
  };
  const helmResourcesListComponent = shallow(
    <HelmResourcesListComponent {...helmResourcesListComponentProps} />,
  );

  it('should render the Table component', () => {
    expect(helmResourcesListComponent.find(Table).exists()).toBe(true);
  });
  it('should render the proper Headers in the Resources tab', () => {
    const expectedHelmResourcesPageHeader: string[] = ['Name', 'Kind', 'Status', 'Timestamp'];

    const headers = helmResourcesListComponent
      .find(Table)
      .props()
      .Header();
    expectedHelmResourcesPageHeader.forEach((header, i) => {
      expect(headers[i].title).toBe(header);
    });
  });
});
