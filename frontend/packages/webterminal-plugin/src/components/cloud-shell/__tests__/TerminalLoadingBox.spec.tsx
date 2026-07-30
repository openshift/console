import { render, screen } from '@testing-library/react';
import TerminalLoadingBox from '../TerminalLoadingBox';

describe('TerminalLoadingBox', () => {
  it('should render the default message if message prop is not there', () => {
    render(<TerminalLoadingBox />);
    expect(
      screen.getByText('Connecting to your OpenShift command line terminal ...'),
    ).toBeVisible();
  });

  it('should render the message prop', () => {
    render(<TerminalLoadingBox message="Lorem ipsum" />);
    expect(screen.getByText('Lorem ipsum')).toBeVisible();
  });
});
