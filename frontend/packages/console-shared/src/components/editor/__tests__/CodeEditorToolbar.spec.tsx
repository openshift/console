import { render, screen, fireEvent } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { ActionType } from '@console/internal/reducers/ols';
import { useOLSConfig } from '../../../hooks/ols-hook';
import { AskOpenShiftLightspeedButton, CodeEditorToolbar } from '../CodeEditorToolbar';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../../hooks/ols-hook', () => ({
  useOLSConfig: jest.fn(),
}));

describe('CodeEditorToolbar', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: (key: string) => key });
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  it('should render null when showShortcuts is false and toolbarLinks is empty', () => {
    const { container } = render(<CodeEditorToolbar />);
    expect(container.firstChild).toBeNull();
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

  it('should dispatch OpenOLS action when "Ask OpenShift Lightspeed" button is clicked', () => {
    (useOLSConfig as jest.Mock).mockReturnValue(true);
    render(<AskOpenShiftLightspeedButton />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.OpenOLS });
  });
});
