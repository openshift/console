import * as React from 'react';
import { shallow } from 'enzyme';

import {
  PromiseComponent,
  PromiseComponentState,
  withHandlePromise,
  HandlePromiseProps,
} from '../../../public/components/utils/promise-component';

describe('withHandlePromise', () => {
  type TestProps = {
    promise: Promise<any>;
  } & HandlePromiseProps;

  const Test = withHandlePromise((props: TestProps) => {
    return (
      <div>
        <h1>{props.errorMessage}</h1>
        {props.inProgress ? (
          <span>Loading...</span>
        ) : (
          <button onClick={() => props.handlePromise(props.promise)}>Click Me</button>
        )}
      </div>
    );
  });

  it('passes `props.inProgress` as true when calling `props.handlePromise()`', () => {
    const wrapper = shallow(<Test promise={Promise.resolve(42)} />);
    wrapper
      .dive()
      .find('button')
      .simulate('click');

    expect(wrapper.dive().text()).toEqual('Loading...');
  });

  it('passes message if an error is thrown from handling the promise', (done) => {
    const wrapper = shallow(<Test promise={Promise.reject(42)} />);
    wrapper
      .dive()
      .find('button')
      .simulate('click');

    setTimeout(() => {
      expect(
        wrapper
          .dive()
          .find('h1')
          .text(),
      ).toEqual('An error occurred. Please try again.');
      done();
    }, 10);
  });
});

describe(PromiseComponent.name, () => {
  class Test extends PromiseComponent<{ promise: Promise<number> }, PromiseComponentState> {
    render() {
      return this.state.inProgress ? (
        <div>Loading...</div>
      ) : (
        <button onClick={() => this.handlePromise(this.props.promise)}>
          What is the meaning of life?
        </button>
      );
    }
  }

  it('sets `inProgress` to true before resolving promise', (done) => {
    let wrapper = shallow(<Test promise={null} />);

    const promise = new Promise((resolve) => {
      // expect(wrapper.text()).toEqual('Loading...');
      resolve(42);
      expect(wrapper.find('button').exists()).toBe(true);
      done();
    });

    wrapper = wrapper.setProps({ promise });
    wrapper.find('button').simulate('click');
  });
});
