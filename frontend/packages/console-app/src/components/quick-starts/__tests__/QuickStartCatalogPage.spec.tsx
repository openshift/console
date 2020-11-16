import * as React from 'react';
import { shallow } from 'enzyme';
import QuickStartCatalogPage from '../QuickStartCatalogPage';
import QuickStartsLoader from '../loader/QuickStartsLoader';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('QuickStarts', () => {
  const quickStartWrapper = shallow(<QuickStartCatalogPage />);

  it('should load a QuickStartCatalog', () => {
    expect(quickStartWrapper.find(QuickStartsLoader).exists()).toBeTruthy();
  });
});
