import { screen } from '@testing-library/react';
import { Map as ImmutableMap } from 'immutable';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ConsolePluginCSPStatusDetail from '../ConsolePluginCSPStatusDetail';

jest.mock('../ConsoleOperatorConfig', () => ({
  ConsolePluginCSPStatus: ({ hasViolations }: { hasViolations: boolean }) => (
    <span>{hasViolations ? 'Has violations' : 'No violations'}</span>
  ),
}));

describe('ConsolePluginCSPStatusDetail', () => {
  const createMockObj = (name: string) => ({
    metadata: { name },
  });

  const renderWithCSPState = (pluginName: string, cspViolations: Record<string, boolean>) => {
    renderWithProviders(<ConsolePluginCSPStatusDetail obj={createMockObj(pluginName)} />, {
      initialState: {
        UI: ImmutableMap({
          pluginCSPViolations: cspViolations,
        }),
      },
    });
  };

  it('should display no violations when plugin has no CSP violations', () => {
    renderWithCSPState('test-plugin', { 'test-plugin': false });

    expect(screen.getByText('No violations')).toBeVisible();
  });

  it('should display has violations when plugin has CSP violations', () => {
    renderWithCSPState('test-plugin', { 'test-plugin': true });

    expect(screen.getByText('Has violations')).toBeVisible();
  });

  it('should display no violations when plugin is not in violations list', () => {
    renderWithCSPState('test-plugin', { 'other-plugin': true });

    expect(screen.getByText('No violations')).toBeVisible();
  });

  it('should display no violations when violations list is empty', () => {
    renderWithCSPState('test-plugin', {});

    expect(screen.getByText('No violations')).toBeVisible();
  });

  it('should correctly identify plugin among multiple plugins', () => {
    renderWithCSPState('target-plugin', {
      'plugin-a': false,
      'target-plugin': true,
      'plugin-b': false,
    });

    expect(screen.getByText('Has violations')).toBeVisible();
  });
});
