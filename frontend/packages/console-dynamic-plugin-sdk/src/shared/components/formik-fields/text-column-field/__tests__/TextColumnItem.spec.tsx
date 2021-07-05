import * as React from 'react';
import { shallow } from 'enzyme';
import TextColumnItem from '../TextColumnItem';
import TextColumnItemContent from '../TextColumnItemContent';
import TextColumnItemWithDnd from '../TextColumnItemWithDnd';

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
  });

  it('should not contain dndEnabled if the props is not passed', () => {
    const wrapper = shallow(
      <TextColumnItem
        name={'fieldName'}
        label={'label value'}
        idx={0}
        rowValues={['']}
        arrayHelpers={mockArrayHelper}
      />,
    );
    expect(wrapper.find(TextColumnItemContent).exists()).toBe(true);
    expect(wrapper.find(TextColumnItemContent).props().dndEnabled).toBeUndefined();
  });
});

describe('TextColumnItemWithDnd', () => {
  it('should render TextColumnItemWithDnd', () => {
    const wrapper = shallow(
      <TextColumnItemWithDnd
        name={'fieldName'}
        label={'label value'}
        idx={0}
        rowValues={['']}
        arrayHelpers={mockArrayHelper}
      />,
    );
    expect(wrapper.isEmptyRender()).toBe(false);
    expect(wrapper.find(TextColumnItemContent).exists()).toBe(true);
  });

  it('should pass dndEnabled props to TextColumnItemContent', () => {
    const wrapper = shallow(
      <TextColumnItemWithDnd
        name={'fieldName'}
        label={'label value'}
        idx={0}
        rowValues={['']}
        dndEnabled
        arrayHelpers={mockArrayHelper}
      />,
    );
    expect(wrapper.find(TextColumnItemContent).exists()).toBe(true);
    expect(wrapper.find(TextColumnItemContent).props().dndEnabled).toBe(true);
    expect(wrapper.find(TextColumnItemContent).props().previewDropRef).not.toBe(null);
    expect(wrapper.find(TextColumnItemContent).props().dragRef).not.toBe(null);
  });
});
