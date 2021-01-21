import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import Spy = jasmine.Spy;

import {
  ConfigureUpdateStrategy,
  ConfigureUpdateStrategyProps,
} from '@console/internal/components/modals/configure-update-strategy-modal';
import { RadioInput } from '@console/internal/components/radio';

jest.mock('i18next');

describe(ConfigureUpdateStrategy.displayName, () => {
  let wrapper: ShallowWrapper<ConfigureUpdateStrategyProps>;
  let onChangeStrategyType: Spy;
  let onChangeMaxSurge: Spy;
  let onChangeMaxUnavailable: Spy;

  beforeEach(() => {
    onChangeStrategyType = jasmine.createSpy('onChangeStrategyType');
    onChangeMaxSurge = jasmine.createSpy('onChangeMaxSurge');
    onChangeMaxUnavailable = jasmine.createSpy('onChangeMaxUnavailable');

    wrapper = shallow(
      <ConfigureUpdateStrategy
        onChangeStrategyType={onChangeStrategyType}
        onChangeMaxSurge={onChangeMaxSurge}
        onChangeMaxUnavailable={onChangeMaxUnavailable}
        strategyType="Recreate"
        maxSurge={null}
        maxUnavailable={null}
      />,
    );
  });

  it('renders two choices for different update strategy types', () => {
    expect(
      wrapper
        .find(RadioInput)
        .at(0)
        .props().value,
    ).toEqual('RollingUpdate');
    expect(
      wrapper
        .find(RadioInput)
        .at(1)
        .props().value,
    ).toEqual('Recreate');
    expect(
      wrapper
        .find(RadioInput)
        .at(1)
        .props().checked,
    ).toBe(true);
  });

  it('is a controlled component', () => {
    wrapper
      .find(RadioInput)
      .at(0)
      .dive()
      .find('input[type="radio"]')
      .simulate('change', { target: { value: 'RollingUpdate' } });
    wrapper.find('#input-max-unavailable').simulate('change', { target: { value: '25%' } });
    wrapper.find('#input-max-surge').simulate('change', { target: { value: '50%' } });

    expect(onChangeStrategyType.calls.argsFor(0)[0]).toEqual('RollingUpdate');
    expect(onChangeMaxUnavailable.calls.argsFor(0)[0]).toEqual('25%');
    expect(onChangeMaxSurge.calls.argsFor(0)[0]).toEqual('50%');
  });
});
