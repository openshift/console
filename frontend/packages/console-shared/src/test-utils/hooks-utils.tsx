import { render, act, RenderOptions } from '@testing-library/react';

type ResultRef<T> = { current: T };
type RerenderFn = () => void;

/** @deprecated use renderHook from '@testing-library/react' */
export const testHook = <T,>(hook: () => T, options?: Pick<RenderOptions, 'wrapper'>) => {
  const result: ResultRef<T> = { current: (undefined as unknown) as T };
  let rerender: RerenderFn = () => {};

  function Wrapper() {
    result.current = hook();
    return null;
  }

  const { rerender: rtlRerender } = render(<Wrapper />, options);
  rerender = () => act(() => rtlRerender(<Wrapper />));

  return { result, rerender };
};
