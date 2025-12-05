import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { renderWithProviders } from '../../../../test-utils/unit-test-utils';
import TextColumnItem from '../TextColumnItem';
import TextColumnItemWithDnd from '../TextColumnItemWithDnd';

jest.mock('react-dnd', () => {
  const reactDnd = jest.requireActual('react-dnd');
  return {
    ...reactDnd,
    useDrag: jest.fn(() => [{}, jest.fn(), jest.fn()]),
    useDrop: jest.fn(() => [{ opacity: 1 }, jest.fn()]),
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

const renderInFormik = (component: React.ReactElement) => {
  return renderWithProviders(
    <Formik initialValues={{ fieldName: [''] }} onSubmit={jest.fn()}>
      {component}
    </Formik>,
  );
};

describe('TextColumnItem', () => {
  it('should render TextColumnItem with input field and remove button', () => {
    renderInFormik(
      <TextColumnItem
        name={'fieldName'}
        label={'label value'}
        idx={0}
        rowValues={['']}
        arrayHelpers={mockArrayHelper}
      />,
    );

    expect(screen.getByRole('textbox')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeVisible();
  });

  it('should not show drag handle when dndEnabled is not passed', () => {
    const { container } = renderInFormik(
      <TextColumnItem
        name={'fieldName'}
        label={'label value'}
        idx={0}
        rowValues={['']}
        arrayHelpers={mockArrayHelper}
      />,
    );

    // Drag handle is wrapped in a div with cursor: move style
    const dragHandle = container.querySelector('[style*="cursor: move"]');
    expect(dragHandle).not.toBeInTheDocument();
  });
});

describe('TextColumnItemWithDnd', () => {
  it('should render TextColumnItemWithDnd with input field and remove button', () => {
    renderInFormik(
      <TextColumnItemWithDnd
        name={'fieldName'}
        label={'label value'}
        idx={0}
        rowValues={['']}
        arrayHelpers={mockArrayHelper}
      />,
    );

    expect(screen.getByRole('textbox')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeVisible();
  });

  it('should show drag handle when dndEnabled prop is passed', () => {
    const { container } = renderInFormik(
      <TextColumnItemWithDnd
        name={'fieldName'}
        label={'label value'}
        idx={0}
        rowValues={['']}
        dndEnabled
        arrayHelpers={mockArrayHelper}
      />,
    );

    // Drag handle is wrapped in a div with cursor: move style
    expect(container.querySelector('[style*="cursor: move"]')).toBeInTheDocument();
  });
});
