/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';

import { ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, withFallback } from '../../../public/components/utils/error-boundary';

describe(ErrorBoundary.name, () => {
  let wrapper: ShallowWrapper<ErrorBoundaryProps, ErrorBoundaryState>;
  const Child = () => <span>childrens</span>;

  beforeEach(() => {
    wrapper = shallow(<ErrorBoundary>
      <Child />
    </ErrorBoundary>);
  });

  it('renders child components if not in error state', () => {
    expect(wrapper.find(Child).exists()).toBe(true);
  });

  it('renders fallback component if given when in error state', () => {
    const FallbackComponent = () => <p>Custom Fallback</p>;
    wrapper = wrapper.setProps({FallbackComponent});
    wrapper = wrapper.setState({hasError: true});

    expect(wrapper.find(Child).exists()).toBe(false);
    expect(wrapper.find(FallbackComponent).exists()).toBe(true);
  });

  it('renders default fallback component if none given when in error state', () => {
    wrapper = wrapper.setState({hasError: true});

    expect(wrapper.find(Child).exists()).toBe(false);
    expect(wrapper.childAt(0).text()).toEqual('');
  });
});

describe('withFallback', () => {
  const Component: React.SFC<{size: number}> = (props) => <span>childrens: {props.size}</span>;

  it('returns the given component wrapped in an `ErrorBoundary`', () => {
    const WrappedComponent = withFallback(Component);
    const wrapper = shallow(<WrappedComponent size={1} />);

    expect(wrapper.find(ErrorBoundary).exists()).toBe(true);
    expect(wrapper.find(Component).exists()).toBe(true);
  });

  it('passes fallback component to `ErrorBoundary`', () => {
    const FallbackComponent = () => <p>Custom Fallback</p>;
    const WrappedComponent = withFallback(Component, FallbackComponent);
    const wrapper = shallow(<WrappedComponent size={1} />);

    expect(wrapper.find(ErrorBoundary).props().FallbackComponent).toEqual(FallbackComponent);
  });
});
