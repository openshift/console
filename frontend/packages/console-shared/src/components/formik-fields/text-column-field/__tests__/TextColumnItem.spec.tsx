import { screen } from '@testing-library/react';
import { Formik } from 'formik';
import { renderWithProviders } from '../../../../test-utils/unit-test-utils';
import TextColumnItem from '../TextColumnItem';

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
});
