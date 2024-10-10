import * as React from 'react';
import { render } from '@testing-library/react';
import TerminalLoadingBox from '../TerminalLoadingBox';

describe('TerminalLoadingBox', () => {
  it('should render the default message if message prop is not there', () => {
    const { getByText } = render(<TerminalLoadingBox />);
    getByText('Connecting to your OpenShift command line terminal ...');
  });

  it('should render the message prop', () => {
    const { getByText } = render(<TerminalLoadingBox message="Lorem ipsum" />);
    getByText('Lorem ipsum');
  });
});
