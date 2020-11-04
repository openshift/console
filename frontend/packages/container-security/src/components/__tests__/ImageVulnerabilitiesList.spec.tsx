import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { MultiListPage } from '@console/internal/components/factory';
import { fakeVulnFor } from '../../../integration-tests/bad-pods';
import { Priority } from '../../const';
import ImageVulnerabilitiesList from '../ImageVulnerabilitiesList';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('ImageVulnerabilitiesList', () => {
  type ImageVulnerabilitiesListProps = React.ComponentProps<typeof ImageVulnerabilitiesList>;
  const vuln = fakeVulnFor(Priority.Critical);
  const props: ImageVulnerabilitiesListProps = {
    obj: vuln,
    match: {
      url: '',
      isExact: false,
      path: '',
      params: { ns: 'namespace' },
    },
  };
  const wrapper: ShallowWrapper<ImageVulnerabilitiesListProps> = shallow(
    <ImageVulnerabilitiesList {...props} />,
  );
  it('should render ImageVulnerabilitiesList', () => {
    expect(wrapper.find(MultiListPage).exists()).toBe(true);
  });
  it('should have Type and Severity row filter', () => {
    const { rowFilters } = wrapper.find(MultiListPage).props();
    expect(rowFilters[0].filterGroupName).toBe('container-security~Severity');
  });
});
