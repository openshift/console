import { Store } from 'react-redux';

interface StoreProps<S> {
  store?: Store<S>;
}

export function getStoreTypedComponent<T = any, P = {}, S = any>(
  component: React.ComponentClass<P, S>,
): React.ComponentClass<P & StoreProps<T>> {
  return component as any;
}
