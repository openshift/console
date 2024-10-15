import * as React from 'react';
import { render, fireEvent, configure } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { ModalCodeReplace } from '../replace-code-modal';

configure({ testIdAttribute: 'data-test' });

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ModalCodeReplace', () => {
  const handleCodeReplaceMock = jest.fn();

  beforeEach(() => {
    handleCodeReplaceMock.mockClear();
  });

  const renderComponent = () =>
    render(<ModalCodeReplace handleCodeReplace={handleCodeReplaceMock} />);

  it('should render the modal with correct title and message', () => {
    const { getByText } = renderComponent();

    // Check for title and message
    expect(getByText('Replace current content?')).toBeTruthy();
    expect(getByText('Existing content will be replaced. Do you want to continue?')).toBeTruthy();
  });

  it('should render buttons with correct text', () => {
    const { getByText } = renderComponent();

    // Check for button texts
    expect(getByText('Yes')).toBeTruthy();
    expect(getByText('No')).toBeTruthy();
    expect(getByText('Keep both')).toBeTruthy();
  });

  it('should call handleCodeReplace when "Yes" button is clicked', () => {
    const { getByText } = renderComponent();

    // Simulate click on "Yes" button
    fireEvent.click(getByText('Yes'));
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });

  it('should call handleCodeReplace when "No" button is clicked', () => {
    const { getByText } = renderComponent();

    // Simulate click on "No" button
    fireEvent.click(getByText('No'));
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });

  it('should call handleCodeReplace when "Keep both" button is clicked', () => {
    const { getByText } = renderComponent();

    // Simulate click on "Keep both" button
    fireEvent.click(getByText('Keep both'));
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });
});
