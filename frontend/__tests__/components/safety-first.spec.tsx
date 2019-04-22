/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { useSafetyFirst } from '../../public/components/safety-first';

describe('useSafetyFirst', () => {
  let wrapper: ReactWrapper;

  type Props = {
    loader: () => Promise<any>;
  };

  const Safe: React.SFC<Props> = (props) => {
    const [inFlight, setInFlight] = useSafetyFirst(true);

    const onClick = () => props.loader().then(() => setInFlight(false));

    return <button onClick={onClick}>Load{inFlight ? 'ing...' : 'ed'}</button>;
  };

  const Unsafe: React.SFC<Props> = (props) => {
    const [inFlight, setInFlight] = React.useState(true);

    const onClick = () => props.loader().then(() => setInFlight(false));

    return <button onClick={onClick}>Load{inFlight ? 'ing...' : 'ed'}</button>;
  };

  beforeEach(() => {
    wrapper = mount(<Safe loader={null} />);
  });

  it('throws warning when updating state after unmounting', (done) => {
    const consoleErrorSpy = spyOn(console, 'error').and.callThrough();

    wrapper = mount(<Unsafe loader={null} />);
    const loader = () => new Promise(resolve => {
      expect(wrapper.text()).toEqual('Loading...');
      wrapper.unmount();
      resolve();
      console.log(consoleErrorSpy.calls.all());
      // expect(consoleErrorSpy.calls.all().some(call => call.args[0].contains)).toBe(false);
      done();
    });

    wrapper = wrapper.setProps({loader});
    wrapper.find('button').simulate('click');
  });

  xit('does not attempt to set React state if unmounted', (done) => {
    const loader = () => new Promise(resolve => {
      expect(wrapper.text()).toEqual('Loading...');
      wrapper.unmount();
      resolve();
      done();
    });

    wrapper = wrapper.setProps({loader});
    wrapper.find('button').simulate('click');
  });

  xit('will set React state if mounted', (done) => {
    const loader = () => new Promise(resolve => {
      expect(wrapper.text()).toEqual('Loading...');
      resolve();
      expect(wrapper.text()).toEqual('Loaded');
      done();
    });

    wrapper = wrapper.setProps({loader});
    wrapper.find('button').simulate('click');
  });
});
