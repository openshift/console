import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'react-i18next';
import { ActionType } from '@console/internal/reducers/ols';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useOLSConfig } from '../../../hooks/useOLSConfig';
import { AskOpenShiftLightspeedButton, CodeEditorToolbar } from '../CodeEditorToolbar';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: jest.fn(),
}));

jest.mock('../../../hooks/useOLSConfig', () => ({
  useOLSConfig: jest.fn(),
}));

describe('CodeEditorToolbar', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: (key: string) => key });
    (useConsoleDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  it('should render null when showShortcuts is false and toolbarLinks is empty', () => {
    const { container } = render(<CodeEditorToolbar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render toolbar with custom links when toolbarLinks are provided', () => {
    render(<CodeEditorToolbar toolbarLinks={[<div key="custom">Custom Link</div>]} />);
    expect(screen.getByText('Custom Link')).toBeInTheDocument();
  });

  it('should render "Ask OpenShift Lightspeed" button when showLightspeedButton is true', () => {
    (useOLSConfig as jest.Mock).mockReturnValue(true);
    render(<AskOpenShiftLightspeedButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should not render "Ask OpenShift Lightspeed" button when showLightspeedButton is false', () => {
    (useOLSConfig as jest.Mock).mockReturnValue(false);
    render(<AskOpenShiftLightspeedButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should dispatch OpenOLS action when "Ask OpenShift Lightspeed" button is clicked', async () => {
    const user = userEvent.setup();
    (useOLSConfig as jest.Mock).mockReturnValue(true);
    render(<AskOpenShiftLightspeedButton />);
    const button = screen.getByRole('button');
    await user.click(button);
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.OpenOLS });
  });
});
