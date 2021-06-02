import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import * as redux from 'react-redux';
import { QueryInput } from '@console/internal/components/monitoring/metrics';
import { Dropdown } from '@console/internal/components/utils';
import MetricsQueryInput from '../MetricsQueryInput';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});
const I18N_NS = 'devconsole';
describe('Metrics Query Input', () => {
  // FIXME upgrading redux types is causing many errors at this time
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const spySelector = jest.spyOn(redux, 'useSelector');
  spySelector.mockReturnValue({ queryBrowser: { queries: [] } });
  // FIXME upgrading redux types is causing many errors at this time
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  const spyDispatch = jest.spyOn(redux, 'useDispatch');
  spyDispatch.mockReturnValue(() => {});
  it('should render Dropdown with default title', () => {
    const wrapper = shallow(<MetricsQueryInput />);
    expect(wrapper.find(Dropdown)).toHaveLength(1);
    expect(wrapper.find(Dropdown).props().title).toEqual(`${I18N_NS}~Select query`);
  });

  it('should render Button with text "Show PromQL" and not render QueryInput', () => {
    const wrapper = shallow(<MetricsQueryInput />);
    expect(wrapper.find(Button)).toHaveLength(1);
    expect(wrapper.find(Button).props().children).toEqual(`${I18N_NS}~Show PromQL`);
    expect(wrapper.find(QueryInput).exists()).toBe(false);
  });

  it('should update Button with text "Hide PromQL" on click and render QueryInput', () => {
    const wrapper = shallow(<MetricsQueryInput />);
    wrapper.find(Button).simulate('click');
    expect(wrapper.find(Button).props().children).toEqual(`${I18N_NS}~Hide PromQL`);
    expect(wrapper.find(QueryInput)).toHaveLength(1);
  });

  it('Custom Querey selection should update Dropdown title, show QueryInput and Button in disabled state', () => {
    const wrapper = shallow(<MetricsQueryInput />);
    wrapper
      .find(Dropdown)
      .props()
      .onChange('#ADD_NEW_QUERY#');
    expect(wrapper.find(QueryInput)).toHaveLength(1);
    expect(wrapper.find(Button).props().children).toEqual(`${I18N_NS}~Hide PromQL`);
    expect(wrapper.find(Button).props().isDisabled).toBe(true);
    expect(wrapper.find(Dropdown).props().title).toEqual(`${I18N_NS}~Custom query`);
  });

  it('Metric selection should update Dropdown title and show Button in enabled state', () => {
    const wrapper = shallow(<MetricsQueryInput />);
    wrapper
      .find(Dropdown)
      .props()
      .onChange('PODS_BY_CPU');
    expect(wrapper.find(Button).props().isDisabled).toBe(false);
    expect(wrapper.find(Dropdown).props().title).toEqual(`${I18N_NS}~CPU usage`);
  });
});
