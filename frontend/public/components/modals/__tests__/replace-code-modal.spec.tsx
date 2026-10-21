import { render, fireEvent } from '@testing-library/react';
import { ReplaceCodeModal } from '../replace-code-modal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ReplaceCodeModal', () => {
  const handleCodeReplaceMock = jest.fn();

  beforeEach(() => {
    handleCodeReplaceMock.mockClear();
  });

  const renderComponent = () =>
    render(<ReplaceCodeModal handleCodeReplace={handleCodeReplaceMock} />);

  it('should render the modal with correct title and message', () => {
    const { getByText } = renderComponent();

    expect(getByText('Replace current content?')).toBeTruthy();
    expect(getByText('Existing content will be replaced. Do you want to continue?')).toBeTruthy();
  });

  it('should render buttons with correct text', () => {
    const { getByText } = renderComponent();

    expect(getByText('Yes')).toBeTruthy();
    expect(getByText('No')).toBeTruthy();
    expect(getByText('Keep both')).toBeTruthy();
  });

  it('should call handleCodeReplace when "Yes" button is clicked', () => {
    const { getByText } = renderComponent();

    fireEvent.click(getByText('Yes'));
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });

  it('should call handleCodeReplace when "No" button is clicked', () => {
    const { getByText } = renderComponent();

    fireEvent.click(getByText('No'));
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });

  it('should call handleCodeReplace when "Keep both" button is clicked', () => {
    const { getByText } = renderComponent();

    fireEvent.click(getByText('Keep both'));
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });

  it('should call handleCodeReplace when close button (X) is clicked', () => {
    const { getByLabelText } = renderComponent();

    const closeButton = getByLabelText('Close');
    expect(closeButton).toBeTruthy();

    fireEvent.click(closeButton);
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });
});
