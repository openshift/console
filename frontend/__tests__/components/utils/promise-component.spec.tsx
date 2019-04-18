/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { shallow } from 'enzyme';

import { PromiseComponent, PromiseComponentState } from '../../../public/components/utils/promise-component';

describe(PromiseComponent.name, () => {
  class Test extends PromiseComponent<{promise: Promise<number>}, PromiseComponentState> {
    render() {
      return this.state.inProgress
        ? <div>Loading...</div>
        : <button onClick={() => this.handlePromise(this.props.promise)}>What is the meaning of life?</button>;
    }
  }

  it('sets `inProgress` to true before resolving promise', (done) => {
    let wrapper = shallow(<Test promise={null} />);

    const promise = new Promise(resolve => {
      // expect(wrapper.text()).toEqual('Loading...');
      resolve(42);
      expect(wrapper.find('button').exists()).toBe(true);
      done();
    });

    wrapper = wrapper.setProps({promise});
    wrapper.find('button').simulate('click');
  });
});
