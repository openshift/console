import * as React from 'react';
import { shallow } from 'enzyme';
import GuidedTourMastheadTrigger from '../GuidedTourMastheadTrigger';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('GuidedTourMastheadTrigger', () => {
  it('should render button when tour is available', () => {
    spyOn(React, 'useContext').and.returnValue({ tour: { steps: [] } });
    const wrapper = shallow(<GuidedTourMastheadTrigger />);
    expect(wrapper.find('button').exists()).toBeTruthy();
  });

  it('should render null when tour is not available', () => {
    spyOn(React, 'useContext').and.returnValue({ tour: null });
    const wrapper = shallow(<GuidedTourMastheadTrigger />);
    expect(wrapper.isEmptyRender()).toBeTruthy();
  });
});
