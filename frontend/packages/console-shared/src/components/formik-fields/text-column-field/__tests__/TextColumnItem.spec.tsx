import * as React from 'react';
import { shallow } from 'enzyme';
import { MinusCircleIcon, GripVerticalIcon } from '@patternfly/react-icons';
import TextColumnItem from '../TextColumnItem';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('react-dnd', () => {
  const reactDnd = require.requireActual('react-dnd');
  return {
    ...reactDnd,
    useDrag: jest.fn(() => [{}, {}]),
    useDrop: jest.fn(() => [{}, {}]),
  };
});

const mockArrayHelper = {
  push: jest.fn(),
  handlePush: jest.fn(),
  swap: jest.fn(),
  handleSwap: jest.fn(),
  move: jest.fn(),
  handleMove: jest.fn(),
  insert: jest.fn(),
  handleInsert: jest.fn(),
  replace: jest.fn(),
  handleReplace: jest.fn(),
  unshift: jest.fn(),
  handleUnshift: jest.fn(),
  handleRemove: jest.fn(),
  handlePop: jest.fn(),
  remove: jest.fn(),
  pop: jest.fn(),
};

describe('TextColumnItem', () => {
  it('should render TextColumnItem', () => {
    const wrapper = shallow(
      <TextColumnItem
        name={'fieldName'}
        label={'label value'}
        idx={0}
        rowValues={['']}
        arrayHelpers={mockArrayHelper}
      />,
    );
    expect(wrapper.isEmptyRender()).toBe(false);
    expect(wrapper.find(MinusCircleIcon).exists()).toBe(true);
  });

  it('should render GripLinesVerticalIcon if dndEnabled is true', () => {
    const wrapper = shallow(
      <TextColumnItem
        name={'fieldName'}
        label={'label value'}
        idx={0}
        rowValues={['']}
        arrayHelpers={mockArrayHelper}
      />,
    );
    expect(wrapper.find(GripVerticalIcon).exists()).toBe(false);
    expect(wrapper.find(MinusCircleIcon).exists()).toBe(true);
  });

  it('should not render GripLinesVerticalIcon if dndEnabled is false', () => {
    const wrapper = shallow(
      <TextColumnItem
        name={'fieldName'}
        label={'label value'}
        idx={0}
        rowValues={['']}
        arrayHelpers={mockArrayHelper}
      />,
    );
    expect(wrapper.find(GripVerticalIcon).exists()).toBe(false);
    expect(wrapper.find(MinusCircleIcon).exists()).toBe(true);
  });
});
