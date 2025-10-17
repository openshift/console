import { screen } from '@testing-library/react';
import * as flagsModule from '@console/dynamic-plugin-sdk/src/utils/flags';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import CloudShellTab from '../CloudShellTab';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  Navigate: ({ to, replace }) => `redirect to ${to}${replace ? ' and also replace' : ''}`,
}));

describe('CloudShellTab', () => {
  it('should not render redirect component if flag check is pending', () => {
    spyOn(flagsModule, 'useFlag').and.returnValue(undefined);
    renderWithProviders(<CloudShellTab />);
    expect(screen.queryByTestId('navigate')).toBeNull();
    expect(screen.getByText('OpenShift command line terminal')).toBeInTheDocument();
  });

  it('should render redirect component if both Devworkspaceflag and not Multicluster', () => {
    spyOn(flagsModule, 'useFlag').and.returnValue(false);
    renderWithProviders(<CloudShellTab />);
    expect(screen.getByText('redirect to / and also replace')).toBeInTheDocument();
  });

  it('should render CloudShellTerminal when Devworkspaceflag is true and not MultiCluster', () => {
    spyOn(flagsModule, 'useFlag').and.returnValue(true);
    renderWithProviders(<CloudShellTab />);
    expect(screen.getByTestId('multi-tab-terminal')).toBeInTheDocument();
    expect(screen.getByText('OpenShift command line terminal')).toBeInTheDocument();
  });
});
