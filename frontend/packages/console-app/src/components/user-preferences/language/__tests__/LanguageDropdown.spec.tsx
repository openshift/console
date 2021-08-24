import * as React from 'react';
import { Select } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import LanguageDropdown from '../LanguageDropdown';
import { usePreferredLanguage } from '../usePreferredLanguage';

jest.mock('react', () => {
  const reactActual = require.requireActual('react');
  return {
    ...reactActual,
    useContext: () => jest.fn(),
  };
});

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        changeLanguage: jest.fn(),
        getResourceBundle: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        languages: ['en'],
      },
    }),
  };
});

jest.mock('../../../quick-starts/utils/quick-start-context', () => ({
  getProcessedResourceBundle: jest.fn(),
}));

jest.mock('../usePreferredLanguage', () => ({
  usePreferredLanguage: jest.fn(),
}));

const usePreferredLanguageMock = usePreferredLanguage as jest.Mock;
const preferredLanguageValue = 'ja';

describe('LanguageDropdown', () => {
  let wrapper: ShallowWrapper;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if user preferences have not loaded', () => {
    usePreferredLanguageMock.mockReturnValue(['', jest.fn(), false]);
    spyOn(React, 'useContext').and.returnValue({ getProcessedResourceBundle: jest.fn() });
    wrapper = shallow(<LanguageDropdown />);
    expect(
      wrapper.find('[data-test="dropdown skeleton console.preferredLanguage"]').exists(),
    ).toBeTruthy();
  });

  it('should render select with value corresponding to preferred language if user preferences have loaded and preferred language is defined', () => {
    usePreferredLanguageMock.mockReturnValue([preferredLanguageValue, jest.fn(), true]);
    spyOn(React, 'useContext').and.returnValue({ getProcessedResourceBundle: jest.fn() });
    wrapper = shallow(<LanguageDropdown />);
    expect(wrapper.find('[data-test="dropdown console.preferredLanguage"]').exists()).toBeTruthy();
    expect(wrapper.find(Select).props().selections).toEqual(preferredLanguageValue);
  });

  it('should render select with value from i18next languages if user preferences have loaded but preferred language is not defined', () => {
    usePreferredLanguageMock.mockReturnValue([undefined, jest.fn(), true]);
    spyOn(React, 'useContext').and.returnValue({ getProcessedResourceBundle: jest.fn() });
    wrapper = shallow(<LanguageDropdown />);
    expect(wrapper.find('[data-test="dropdown console.preferredLanguage"]').exists()).toBeTruthy();
    expect(wrapper.find(Select).props().selections).toEqual('en');
  });
});
