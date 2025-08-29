import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NameValueEditor } from '../../../components/utils/name-value-editor';

// Mock i18n
jest.mock('react-i18next', () => ({
  withTranslation: () => (component) => component,
  useTranslation: () => ({
    t: (key) => key.split('~')[1] || key,
  }),
}));

describe('Name Value Editor', () => {
  describe('When supplied with attributes nameString and valueString', () => {
    it('renders header correctly', () => {
      render(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          nameString={'foo'}
          valueString={'bar'}
        />,
      );

      expect(screen.getByText('foo')).toBeInTheDocument();
      expect(screen.getByText('bar')).toBeInTheDocument();
    });
  });

  describe('When supplied with nameValuePairs', () => {
    it('renders PairElement correctly', () => {
      render(
        <NameValueEditor nameValuePairs={[['name', 'value', 0]]} updateParentData={() => {}} />,
      );

      expect(screen.getByDisplayValue('name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('value')).toBeInTheDocument();
    });
  });

  describe('When readOnly attribute is "true"', () => {
    it('does not render add button', () => {
      render(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          readOnly={true}
        />,
      );

      expect(screen.queryByTestId('add-button')).not.toBeInTheDocument();
    });

    it('does not render PairElement buttons', () => {
      render(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          readOnly={true}
        />,
      );
      expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument();
    });
  });

  describe('When readOnly attribute is "false"', () => {
    it('renders add button', () => {
      render(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          readOnly={false}
          allowSorting={true}
        />,
      );

      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });
  });

  describe('When readOnly attribute is "false" and allowSorting is "true"', () => {
    it('renders PairElement buttons correctly', () => {
      render(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          readOnly={false}
          allowSorting={true}
        />,
      );

      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument();
    });
  });

  describe('When allowSorting attribute is "false"', () => {
    it('renders PairElement buttons correctly', () => {
      render(
        <NameValueEditor
          nameValuePairs={[['name', 'value', 0]]}
          updateParentData={() => {}}
          allowSorting={false}
        />,
      );
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
      expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument();
    });
  });
});
