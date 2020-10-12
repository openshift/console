import * as React from 'react';
import { shallow } from 'enzyme';
import { PageLayout } from '@console/shared';
import QuickStartCatalogPage from '../QuickStartCatalogPage';
import QuickStartsLoader from '../loader/QuickStartsLoader';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const i18nNS = 'quickstart';

describe('QuickStarts', () => {
  const quickStartWrapper = shallow(<QuickStartCatalogPage />);

  it('should load page layout with desired title', () => {
    expect(quickStartWrapper.find(PageLayout).exists()).toBeTruthy();
    expect(quickStartWrapper.find(PageLayout).prop('title')).toBe(`${i18nNS}~Quick Starts`);
  });

  it('should load a QuickStartCatalog', () => {
    expect(quickStartWrapper.find(QuickStartsLoader).exists()).toBeTruthy();
  });
});
