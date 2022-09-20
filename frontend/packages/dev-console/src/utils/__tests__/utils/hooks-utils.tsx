import * as React from 'react';
import { mount, MountRendererProps } from 'enzyme';

const useRerender = () => {
  const [, setState] = React.useState(0);
  return () => setState((value) => value + 1);
};

type ResultRef = { current: any };
type RerenderRef = { current?: () => void };

interface TestComponentProps {
  hook: () => void;
  result: ResultRef;
  rerenderRef: RerenderRef;
}

const TestHook: React.FC<TestComponentProps> = ({ hook, result, rerenderRef }) => {
  result.current = hook();
  rerenderRef.current = useRerender();
  return null;
};

export const testHook = <T extends any>(hook: () => T, options?: MountRendererProps) => {
  // Inspired by https://github.com/testing-library/react-hooks-testing-library
  const result = { current: undefined as T };
  const rerenderRef: RerenderRef = {};
  const rerender = () => rerenderRef.current();
  mount(<TestHook hook={hook} result={result} rerenderRef={rerenderRef} />, options);
  return { result, rerender };
};
