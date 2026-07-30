import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    renderComponent();

    expect(screen.getByText('Replace current content?')).toBeVisible();
    expect(
      screen.getByText('Existing content will be replaced. Do you want to continue?'),
    ).toBeVisible();
  });

  it('should render buttons with correct text', () => {
    renderComponent();

    expect(screen.getByText('Yes')).toBeVisible();
    expect(screen.getByText('No')).toBeVisible();
    expect(screen.getByText('Keep both')).toBeVisible();
  });

  it('should call handleCodeReplace when "Yes" button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Yes'));
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });

  it('should call handleCodeReplace when "No" button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('No'));
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });

  it('should call handleCodeReplace when "Keep both" button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText('Keep both'));
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });

  it('should call handleCodeReplace when close button (X) is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeVisible();

    await user.click(closeButton);
    expect(handleCodeReplaceMock).toHaveBeenCalledTimes(1);
  });
});
