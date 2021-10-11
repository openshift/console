import * as React from 'react';
import { Checkbox, Select } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { getLastLanguage } from '../getLastLanguage';
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
        getResourceBundle: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        changeLanguage: jest.fn(),
      },
    }),
  };
});

jest.mock('../usePreferredLanguage', () => ({
  usePreferredLanguage: jest.fn(),
}));

jest.mock('../getLastLanguage', () => ({
  getLastLanguage: jest.fn(),
}));

const usePreferredLanguageMock = usePreferredLanguage as jest.Mock;
const getLastLanguageMock = getLastLanguage as jest.Mock;
const preferredLanguageValue = 'ja';

describe('LanguageDropdown', () => {
  let wrapper: ShallowWrapper;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if user preferences have not loaded', () => {
    usePreferredLanguageMock.mockReturnValue(['', jest.fn(), false]);
    getLastLanguageMock.mockReturnValue(['']);
    spyOn(React, 'useContext').and.returnValue({ getProcessedResourceBundle: jest.fn() });
    wrapper = shallow(<LanguageDropdown />);
    expect(
      wrapper.find('[data-test="dropdown skeleton console.preferredLanguage"]').exists(),
    ).toBeTruthy();
  });

  it('should render checkbox in checked state and select in disabled state if user preferences have loaded and preferred language is not defined', () => {
    usePreferredLanguageMock.mockReturnValue([undefined, jest.fn(), true]);
    getLastLanguageMock.mockReturnValue(['']);
    spyOn(React, 'useContext').and.returnValue({ getProcessedResourceBundle: jest.fn() });
    wrapper = shallow(<LanguageDropdown />);
    expect(wrapper.find('[data-test="checkbox console.preferredLanguage"]').exists()).toBeTruthy();
    expect(wrapper.find(Checkbox).props().isChecked).toBe(true);
    expect(wrapper.find('[data-test="dropdown console.preferredLanguage"]').exists()).toBeTruthy();
    expect(wrapper.find(Select).props().isDisabled).toBe(true);
  });

  it('should render checkbox in unchecked state and select in enabled state if user preferences have loaded and preferred language is defined', () => {
    usePreferredLanguageMock.mockReturnValue([preferredLanguageValue, jest.fn(), true]);
    getLastLanguageMock.mockReturnValue(['']);
    spyOn(React, 'useContext').and.returnValue({ getProcessedResourceBundle: jest.fn() });
    wrapper = shallow(<LanguageDropdown />);
    expect(wrapper.find('[data-test="checkbox console.preferredLanguage"]').exists()).toBeTruthy();
    expect(wrapper.find(Checkbox).props().isChecked).toBe(false);
    expect(wrapper.find('[data-test="dropdown console.preferredLanguage"]').exists()).toBeTruthy();
    expect(wrapper.find(Select).props().isDisabled).toBe(false);
  });

  it('should render select with value corresponding to preferred language if user preferences have loaded and preferred language is defined', () => {
    usePreferredLanguageMock.mockReturnValue([preferredLanguageValue, jest.fn(), true]);
    getLastLanguageMock.mockReturnValue(['']);
    spyOn(React, 'useContext').and.returnValue({ getProcessedResourceBundle: jest.fn() });
    wrapper = shallow(<LanguageDropdown />);
    expect(wrapper.find('[data-test="checkbox console.preferredLanguage"]').exists()).toBeTruthy();
    expect(wrapper.find('[data-test="dropdown console.preferredLanguage"]').exists()).toBeTruthy();
    expect(wrapper.find(Select).props().selections).toEqual(preferredLanguageValue);
  });
});
