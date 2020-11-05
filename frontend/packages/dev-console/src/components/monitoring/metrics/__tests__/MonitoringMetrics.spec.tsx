import * as React from 'react';
import { shallow } from 'enzyme';
import { MonitoringMetrics } from '../MonitoringMetrics';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('Monitoring Metrics Tab', () => {
  it('should render Monitoring Metrics tab', () => {
    const wrapper = shallow(<MonitoringMetrics />);
    expect(wrapper.contains(<title>devconsole~Metrics</title>)).toBe(true);
  });
});
