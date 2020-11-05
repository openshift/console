import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Table } from '@console/internal/components/factory';
import HelmResourcesList from '../HelmReleaseResourcesList';
import HelmReleaseResourcesHeader from '../HelmReleaseResourcesHeader';
import HelmReleaseResourcesRow from '../HelmReleaseResourcesRow';

type Component = typeof HelmResourcesList;
type Props = React.ComponentProps<Component>;
let helmResourcesList: ShallowWrapper<Props>;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('HelmResourcesList', () => {
  beforeEach(() => {
    helmResourcesList = shallow(
      <HelmResourcesList
        Header={HelmReleaseResourcesHeader}
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
      .Header();

    expectedHelmResourcesHeader.forEach((header, i) => {
      expect(headers[i].title).toBe(header);
    });
  });
});
