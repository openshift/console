import * as React from 'react';
import { mount } from 'enzyme';
import { Store } from 'react-redux';

interface StoreProps<S> {
  store?: Store<S>;
}

export function getStoreTypedComponent<T = any, P = {}, S = any>(
  component: React.ComponentClass<P, S>,
): React.ComponentClass<P & StoreProps<T>> {
  return component as any;
}

const TestHook: React.FC<{ callback: () => void }> = ({ callback }) => {
  callback();
  return null;
};

export const testHook = (callback: () => void) => {
  mount(<TestHook callback={callback} />);
};
