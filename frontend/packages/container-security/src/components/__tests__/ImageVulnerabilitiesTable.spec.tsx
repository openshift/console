import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Table, ComponentProps } from '@console/internal/components/factory';
import { fakeVulnFor } from '../../../integration-tests/bad-pods';
import { Priority } from '../../const';
import ImageVulnerabilitiesTable from '../ImageVulnerabilitiesTable';

describe('ImageVulnerabilitiesTable', () => {
  type ImageVulnerabilitiesTableProps = React.ComponentProps<typeof ImageVulnerabilitiesTable>;
  const vuln = fakeVulnFor(Priority.Critical);
  const props: ImageVulnerabilitiesTableProps = {
    features: vuln.spec.features,
  };
  const wrapper: ShallowWrapper<ImageVulnerabilitiesTableProps> = shallow(
    <ImageVulnerabilitiesTable {...props} />,
  );
  it('should render the table component', () => {
    expect(wrapper.find(Table).exists()).toBe(true);
  });

  it('should render the proper header', () => {
    const expectedImageVulnerabilitiesTableHeader: string[] = [
      'Name',
      'Severity',
      'Package',
      'Current version',
      'Fixed in version',
    ];
    const headers = wrapper
      .find(Table)
      .props()
      .Header({} as ComponentProps);
    expectedImageVulnerabilitiesTableHeader.forEach((header, i) => {
      expect(headers[i].title).toBe(header);
    });
  });
});
