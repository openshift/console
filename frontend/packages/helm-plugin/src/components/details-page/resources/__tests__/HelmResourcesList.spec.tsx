import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Table, ComponentProps } from '@console/internal/components/factory';
import HelmReleaseResourcesHeader from '../HelmReleaseResourcesHeader';
import HelmResourcesList from '../HelmReleaseResourcesList';
import HelmReleaseResourcesRow from '../HelmReleaseResourcesRow';

type Component = typeof HelmResourcesList;
type Props = React.ComponentProps<Component>;
let helmResourcesList: ShallowWrapper<Props>;

describe('HelmResourcesList', () => {
  beforeEach(() => {
    helmResourcesList = shallow(
      <HelmResourcesList
        Header={HelmReleaseResourcesHeader()}
        Row={HelmReleaseResourcesRow}
        aria-label="Resources"
      />,
    );
  });

  it('should render the Table component', () => {
    expect(helmResourcesList.find(Table).exists()).toBe(true);
  });

  it('should render the proper Headers in the Resources tab', () => {
    const expectedHelmResourcesHeader: string[] = ['Name', 'Type', 'Status', 'Created'];

    const headers = helmResourcesList
      .find(Table)
      .props()
      .Header({} as ComponentProps);

    expectedHelmResourcesHeader.forEach((header, i) => {
      expect(headers[i].title).toBe(header);
    });
  });
});
