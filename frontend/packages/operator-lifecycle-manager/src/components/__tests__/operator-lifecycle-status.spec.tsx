import { render, screen } from '@testing-library/react';
import type { LifecycleData } from '../operator-lifecycle-status';
import {
  getClusterCompatibility,
  getSupportPhase,
  ClusterCompatibilityStatus,
  SupportPhaseStatus,
} from '../operator-lifecycle-status';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key.replace(/^[^~]+~/, ''),
    i18n: { language: 'en' },
  }),
}));

describe('getClusterCompatibility', () => {
  const lifecycle: LifecycleData = {
    package: 'test-operator',
    schema: 'io.openshift.operators.lifecycles.v1alpha1',
    versions: [
      {
        name: '1.0',
        openshiftCompatibility: ['4.14', '4.15', '4.16'],
        phases: [],
      },
      {
        name: '2.0',
        openshiftCompatibility: ['4.16', '4.17'],
        phases: [],
      },
    ],
  };

  it('returns true when cluster version is compatible', () => {
    expect(getClusterCompatibility(lifecycle, '1.0', '4.15.3')).toBe(true);
  });

  it('returns false when cluster version is not compatible', () => {
    expect(getClusterCompatibility(lifecycle, '1.0', '4.17.0')).toBe(false);
  });

  it('returns undefined when lifecycle data is undefined', () => {
    expect(getClusterCompatibility(undefined, '1.0', '4.15')).toBeUndefined();
  });

  it('returns undefined when cluster version is undefined', () => {
    expect(getClusterCompatibility(lifecycle, '1.0', undefined)).toBeUndefined();
  });

  it('uses first version when operator version is not specified', () => {
    expect(getClusterCompatibility(lifecycle, undefined, '4.14.0')).toBe(true);
  });

  it('returns undefined when versions array is empty', () => {
    const emptyLifecycle: LifecycleData = {
      package: 'test',
      schema: 'test',
      versions: [],
    };
    expect(getClusterCompatibility(emptyLifecycle, '1.0', '4.15')).toBeUndefined();
  });

  it('checks compatibility for specific version', () => {
    expect(getClusterCompatibility(lifecycle, '2.0', '4.17.1')).toBe(true);
    expect(getClusterCompatibility(lifecycle, '2.0', '4.14.0')).toBe(false);
  });

  it('matches operator version by minor version when exact match fails', () => {
    expect(getClusterCompatibility(lifecycle, '1.0.3', '4.15.0')).toBe(true);
    expect(getClusterCompatibility(lifecycle, '2.0.1', '4.17.0')).toBe(true);
    expect(getClusterCompatibility(lifecycle, '2.0.1', '4.14.0')).toBe(false);
  });
});

describe('getSupportPhase', () => {
  const lifecycle: LifecycleData = {
    package: 'test-operator',
    schema: 'io.openshift.operators.lifecycles.v1alpha1',
    versions: [
      {
        name: '1.0',
        openshiftCompatibility: ['4.15'],
        phases: [
          {
            name: 'Maintenance support',
            timeBegin: '2024-01-01',
            timeEnd: '2024-06-30',
          },
          {
            name: 'Extended life cycle support',
            timeBegin: '2024-07-01',
            timeEnd: '2025-06-30',
          },
        ],
      },
    ],
  };

  it('returns the active phase when date falls within a phase', () => {
    const result = getSupportPhase(lifecycle, '1.0', new Date('2024-03-15'));
    expect(result).toEqual({
      name: 'Maintenance support',
      timeBegin: '2024-01-01',
      timeEnd: '2024-06-30',
    });
  });

  it('returns the second phase when date falls within it', () => {
    const result = getSupportPhase(lifecycle, '1.0', new Date('2025-01-15'));
    expect(result).toEqual({
      name: 'Extended life cycle support',
      timeBegin: '2024-07-01',
      timeEnd: '2025-06-30',
    });
  });

  it('returns end-of-life when all phases have ended', () => {
    const result = getSupportPhase(lifecycle, '1.0', new Date('2026-01-01'));
    expect(result).toBe('end-of-life');
  });

  it('returns first phase when date is before all phases', () => {
    const result = getSupportPhase(lifecycle, '1.0', new Date('2023-06-01'));
    expect(result).toEqual({
      name: 'Maintenance support',
      timeBegin: '2024-01-01',
      timeEnd: '2024-06-30',
    });
  });

  it('returns undefined when lifecycle data is undefined', () => {
    expect(getSupportPhase(undefined, '1.0')).toBeUndefined();
  });

  it('returns undefined when versions array is missing', () => {
    const noVersions: LifecycleData = {
      package: 'test',
      schema: 'test',
    };
    expect(getSupportPhase(noVersions, '1.0')).toBeUndefined();
  });

  it('returns undefined when no phases exist', () => {
    const noPhases: LifecycleData = {
      package: 'test',
      schema: 'test',
      versions: [{ name: '1.0', phases: [] }],
    };
    expect(getSupportPhase(noPhases, '1.0')).toBeUndefined();
  });

  it('matches operator version by minor version when exact match fails', () => {
    const result = getSupportPhase(lifecycle, '1.0.5', new Date('2024-03-15'));
    expect(result).toEqual({
      name: 'Maintenance support',
      timeBegin: '2024-01-01',
      timeEnd: '2024-06-30',
    });
  });
});

describe('ClusterCompatibilityStatus', () => {
  it('renders Compatible label when compatible is true', () => {
    render(<ClusterCompatibilityStatus compatible />);
    expect(screen.getByText('Compatible')).toBeInTheDocument();
    expect(screen.getByTestId('cluster-compatibility-compatible')).toBeInTheDocument();
  });

  it('renders Incompatible label when compatible is false', () => {
    render(<ClusterCompatibilityStatus compatible={false} />);
    expect(screen.getByText('Incompatible')).toBeInTheDocument();
    expect(screen.getByTestId('cluster-compatibility-incompatible')).toBeInTheDocument();
  });

  it('renders dash when compatible is undefined', () => {
    render(<ClusterCompatibilityStatus compatible={undefined} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});

describe('SupportPhaseStatus', () => {
  it('renders phase name when active phase is provided', () => {
    const phase = { name: 'Maintenance support', timeBegin: '2024-01-01', timeEnd: '2024-06-30' };
    render(<SupportPhaseStatus phase={phase} />);
    expect(screen.getByText('Maintenance support')).toBeInTheDocument();
    expect(screen.getByTestId('support-phase-active')).toBeInTheDocument();
  });

  it('renders End of life label', () => {
    render(<SupportPhaseStatus phase="end-of-life" />);
    expect(screen.getByText('End of life')).toBeInTheDocument();
    expect(screen.getByTestId('support-phase-eol')).toBeInTheDocument();
  });

  it('renders dash when phase is undefined', () => {
    render(<SupportPhaseStatus phase={undefined} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
