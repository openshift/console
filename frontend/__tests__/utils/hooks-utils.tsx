import * as React from 'react';
import { mount } from 'enzyme';

const TestHook: React.FC<{ callback: () => void }> = ({ callback }) => {
  callback();
  return null;
};

export const testHook = (callback: () => void) => {
  mount(<TestHook callback={callback} />);
};
