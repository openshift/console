
/* eslint-env node */

import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import Spy = jasmine.Spy;

import { useSafetyFirst } from '../../public/components/safety-first';

type Props = {
  loader: () => Promise<any>;
};

const warning = 'perform a React state update on an unmounted component.';

describe('When calling setter from `useState()` hook in an unsafe React component', () => {
  const Unsafe: React.SFC<Props> = (props) => {
    const [inFlight, setInFlight] = React.useState(true);

    const onClick = () => props.loader().then(() => setInFlight(false));

    return <button onClick={onClick}>Load{inFlight ? 'ing...' : 'ed'}</button>;
  };

  it('throws warning when updating state after unmounting', (done) => {
    const consoleErrorSpy = spyOn(global.console, 'error').and.callThrough();

    let wrapper = mount<Props>(<Unsafe loader={null} />);
    const loader = () => new Promise(resolve => {
      expect(wrapper.text()).toEqual('Loading...');
      wrapper.unmount();
      resolve();
    });

    wrapper = wrapper.setProps({loader});
    wrapper.find('button').simulate('click');

    // FIXME(alecmerdler): Shouldn't need a `setTimeout` here...
    setTimeout(() => {
      expect(consoleErrorSpy.calls.all().map(call => call.args[0] as string).some(text => text.includes(warning))).toBe(true);
      done();
    }, 500);
  });
});

describe('useSafetyFirst', () => {
  let wrapper: ReactWrapper<Props>;
  let consoleErrorSpy: Spy;

  const Safe: React.SFC<Props> = (props) => {
    const [inFlight, setInFlight] = useSafetyFirst(true);

    const onClick = () => props.loader().then(() => setInFlight(false));

    return <button onClick={onClick}>Load{inFlight ? 'ing...' : 'ed'}</button>;
  };

  beforeEach(() => {
    consoleErrorSpy = spyOn(global.console, 'error').and.callThrough();
    wrapper = mount<Props>(<Safe loader={null} />);
  });

  it('does not attempt to set React state if unmounted (using hook)', (done) => {
    const loader = () => new Promise(resolve => {
      expect(wrapper.text()).toEqual('Loading...');
      wrapper.unmount();
      resolve();
    });

    wrapper = wrapper.setProps({loader});
    wrapper.find('button').simulate('click');

    // FIXME(alecmerdler): Shouldn't need a `setTimeout` here...
    setTimeout(() => {
      expect(consoleErrorSpy.calls.all().map(call => call.args[0] as string).some(text => text.includes(warning))).toBe(false);
      done();
    }, 500);
  });

  it('will set React state if mounted (using hook)', (done) => {
    const loader = () => new Promise(resolve => {
      expect(wrapper.text()).toEqual('Loading...');
      resolve();
    });

    wrapper = wrapper.setProps({loader});
    wrapper.find('button').simulate('click');

    // FIXME(alecmerdler): Shouldn't need a `setTimeout` here...
    setTimeout(() => {
      expect(wrapper.text()).toEqual('Loaded');
      expect(consoleErrorSpy.calls.all().map(call => call.args[0] as string).some(text => text.includes(warning))).toBe(false);
      done();
    }, 500);
  });
});
