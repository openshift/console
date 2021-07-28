import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { TFunction } from 'i18next';
import { Table, ComponentProps } from '@console/internal/components/factory';
import HelmReleaseResourcesHeader from '../HelmReleaseResourcesHeader';
import HelmResourcesList from '../HelmReleaseResourcesList';
import HelmReleaseResourcesRow from '../HelmReleaseResourcesRow';

type Component = typeof HelmResourcesList;
type Props = React.ComponentProps<Component>;
let helmResourcesList: ShallowWrapper<Props>;
const t = (key: TFunction) => key;

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
        Header={HelmReleaseResourcesHeader(t)}
        Row={HelmReleaseResourcesRow}
        aria-label="Resources"
      />,
    );
  });

  it('should render the Table component', () => {
    expect(helmResourcesList.find(Table).exists()).toBe(true);
  });

  it('should render the proper Headers in the Resources tab', () => {
    const expectedHelmResourcesHeader: string[] = [
      'helm-plugin~Name',
      'helm-plugin~Type',
      'helm-plugin~Status',
      'helm-plugin~Created',
    ];

    const headers = helmResourcesList
      .find(Table)
      .props()
      .Header({} as ComponentProps);

    expectedHelmResourcesHeader.forEach((header, i) => {
      expect(headers[i].title).toBe(header);
    });
  });
});
