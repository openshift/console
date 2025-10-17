import { screen } from '@testing-library/react';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { fakeVulnFor } from '../../../integration-tests/bad-pods';
import { Priority } from '../../const';
import { SecurityBreakdownPopup, securityHealthHandler } from '../summary';

const highVuln = fakeVulnFor(Priority.High);

describe('securityHealthHandler', () => {
  it('returns `UNKNOWN` status if there is an error retrieving `ImageManifestVulns`', () => {
    const vulnerabilities = {
      imageManifestVuln: { loaded: true, loadError: 'failed to fetch', data: [] },
    };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.UNKNOWN);
  });

  it('returns `LOADING` status if still retrieving `ImageManifestVulns`', () => {
    const vulnerabilities = { imageManifestVuln: { loaded: false, loadError: null, data: [] } };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.LOADING);
  });

  it('returns `Error` status if any `ImageManifestVulns` exist', () => {
    const vulnerabilities = {
      imageManifestVuln: { loaded: true, loadError: null, data: [highVuln] },
    };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.ERROR);
  });

  it('returns `OK` status if no vulnerabilities', () => {
    const vulnerabilities = { imageManifestVuln: { loaded: true, loadError: null, data: [] } };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.OK);
  });
});

describe('SecurityBreakdownPopup', () => {
  const imageManifestVuln = {
    loaded: true,
    loadError: null,
    data: [{ ...highVuln, status: { ...highVuln.status, fixableCount: 27 } }],
  };

  it('should display proper message when there are no vulnerabilities', () => {
    renderWithProviders(
      <SecurityBreakdownPopup imageManifestVuln={{ loaded: true, loadError: null, data: [] }} />,
    );

    expect(screen.getByText('No vulnerabilities detected.')).toBeVisible();
  });

  it('should not display section for list of vulnerabilities if there are no fixable vulnerabilities', () => {
    renderWithProviders(
      <SecurityBreakdownPopup
        imageManifestVuln={{
          loaded: true,
          loadError: null,
          data: [{ ...highVuln, status: { ...highVuln.status, fixableCount: 0 } }],
        }}
      />,
    );

    expect(screen.queryByText('Fixable Container Images')).not.toBeInTheDocument();
  });

  it('should display list of impact and vulnerabilities when not in context of a namespace', () => {
    renderWithProviders(<SecurityBreakdownPopup imageManifestVuln={imageManifestVuln} />);

    expect(screen.getByText('Impact')).toBeVisible();
  });

  it('should display list of images and vulnerabilities when in context of a namespace', () => {
    renderWithProviders(
      <SecurityBreakdownPopup imageManifestVuln={imageManifestVuln} namespace="default" />,
    );

    expect(screen.getByText('Image')).toBeVisible();
  });
});
