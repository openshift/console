import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Table, ComponentProps } from '@console/internal/components/factory';
import { fakeVulnFor } from '../../../integration-tests/bad-pods';
import { Priority } from '../../const';
import ImageVulnerabilitiesTable from '../ImageVulnerabilitiesTable';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

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
      'container-security~Name',
      'container-security~Severity',
      'container-security~Package',
      'container-security~Current version',
      'container-security~Fixed in version',
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
