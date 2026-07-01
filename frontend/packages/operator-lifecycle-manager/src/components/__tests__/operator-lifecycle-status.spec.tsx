import { render, screen } from '@testing-library/react';
import type { LifecycleData } from '../operator-lifecycle-status';
import {
  getClusterCompatibility,
  getSupportPhase,
  ClusterCompatibilityStatus,
  SupportPhaseBadge,
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
        platformCompatibility: [{ name: 'openshift', versions: ['4.14', '4.15', '4.16'] }],
        phases: [],
      },
      {
        name: '2.0',
        platformCompatibility: [{ name: 'openshift', versions: ['4.16', '4.17'] }],
        phases: [],
      },
    ],
  };

  it('returns compatible when cluster version is in the list', () => {
    expect(getClusterCompatibility(lifecycle, '1.0', '4.15.3')).toBe('compatible');
  });

  it('returns incompatible when cluster version is not in the list', () => {
    expect(getClusterCompatibility(lifecycle, '1.0', '4.17.0')).toBe('incompatible');
  });

  it('returns no-data when lifecycle data is undefined', () => {
    expect(getClusterCompatibility(undefined, '1.0', '4.15')).toBe('no-data');
  });

  it('returns no-data when cluster version is undefined', () => {
    expect(getClusterCompatibility(lifecycle, '1.0', undefined)).toBe('no-data');
  });

  it('uses first version when operator version is not specified', () => {
    expect(getClusterCompatibility(lifecycle, undefined, '4.14.0')).toBe('compatible');
  });

  it('returns no-data when versions array is empty', () => {
    const emptyLifecycle: LifecycleData = {
      package: 'test',
      schema: 'test',
      versions: [],
    };
    expect(getClusterCompatibility(emptyLifecycle, '1.0', '4.15')).toBe('no-data');
  });

  it('returns no-data when platformCompatibility is not defined', () => {
    const noCompatLifecycle: LifecycleData = {
      package: 'test',
      schema: 'test',
      versions: [{ name: '1.0' }],
    };
    expect(getClusterCompatibility(noCompatLifecycle, '1.0', '4.15')).toBe('no-data');
  });

  it('checks compatibility for specific version', () => {
    expect(getClusterCompatibility(lifecycle, '2.0', '4.17.1')).toBe('compatible');
    expect(getClusterCompatibility(lifecycle, '2.0', '4.14.0')).toBe('incompatible');
  });

  it('matches operator version by minor version when exact match fails', () => {
    expect(getClusterCompatibility(lifecycle, '1.0.3', '4.15.0')).toBe('compatible');
    expect(getClusterCompatibility(lifecycle, '2.0.1', '4.17.0')).toBe('compatible');
    expect(getClusterCompatibility(lifecycle, '2.0.1', '4.14.0')).toBe('incompatible');
  });

  it('returns no data for an invalid operator version', () => {
    expect(getClusterCompatibility(lifecycle, 'latest', '4.15.0')).toBe('no-data');
  });
});

describe('getSupportPhase', () => {
  const lifecycle: LifecycleData = {
    package: 'test-operator',
    schema: 'io.openshift.operators.lifecycles.v1alpha1',
    versions: [
      {
        name: '1.0',
        platformCompatibility: [{ name: 'openshift', versions: ['4.15'] }],
        phases: [
          {
            name: 'Maintenance support',
            startDate: '2024-01-01',
            endDate: '2024-06-30',
          },
          {
            name: 'Extended life cycle support',
            startDate: '2024-07-01',
            endDate: '2025-06-30',
          },
        ],
      },
    ],
  };

  const allPhases = lifecycle.versions[0].phases;

  it('returns current phase and all phases when date falls within a phase', () => {
    const result = getSupportPhase(lifecycle, '1.0', new Date('2024-03-15'));
    expect(result).toEqual({
      status: SupportPhaseStatus.Active,
      currentPhase: {
        name: 'Maintenance support',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      },
      allPhases,
    });
  });

  it('returns the second phase when date falls within it', () => {
    const result = getSupportPhase(lifecycle, '1.0', new Date('2025-01-15'));
    expect(result).toEqual({
      status: SupportPhaseStatus.Active,
      currentPhase: {
        name: 'Extended life cycle support',
        startDate: '2024-07-01',
        endDate: '2025-06-30',
      },
      allPhases,
    });
  });

  it('returns self-support with phases when all phases have ended', () => {
    const result = getSupportPhase(lifecycle, '1.0', new Date('2026-01-01'));
    expect(result).toEqual({ status: SupportPhaseStatus.SelfSupport, allPhases });
  });

  it('returns first phase when date is before all phases', () => {
    const result = getSupportPhase(lifecycle, '1.0', new Date('2023-06-01'));
    expect(result).toEqual({
      status: SupportPhaseStatus.Active,
      currentPhase: {
        name: 'Maintenance support',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      },
      allPhases,
    });
  });

  it('returns no-data when lifecycle data is undefined', () => {
    expect(getSupportPhase(undefined, '1.0')).toEqual({ status: SupportPhaseStatus.NoData });
  });

  it('returns no-data when versions array is missing', () => {
    const noVersions: LifecycleData = {
      package: 'test',
      schema: 'test',
    };
    expect(getSupportPhase(noVersions, '1.0')).toEqual({ status: SupportPhaseStatus.NoData });
  });

  it('returns no-data when phases array is empty', () => {
    const noPhases: LifecycleData = {
      package: 'test',
      schema: 'test',
      versions: [{ name: '1.0', phases: [] }],
    };
    expect(getSupportPhase(noPhases, '1.0')).toEqual({ status: SupportPhaseStatus.NoData });
  });

  it('returns no-data when phases are not defined', () => {
    const noPhases: LifecycleData = {
      package: 'test',
      schema: 'test',
      versions: [{ name: '1.0' }],
    };
    expect(getSupportPhase(noPhases, '1.0')).toEqual({ status: SupportPhaseStatus.NoData });
  });

  it('returns no data for an invalid operator version', () => {
    expect(getSupportPhase(lifecycle, 'latest', new Date('2024-03-15'))).toEqual({
      status: SupportPhaseStatus.NoData,
    });
  });

  it('matches operator version by minor version when exact match fails', () => {
    const result = getSupportPhase(lifecycle, '1.0.5', new Date('2024-03-15'));
    expect(result).toEqual({
      status: SupportPhaseStatus.Active,
      currentPhase: {
        name: 'Maintenance support',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      },
      allPhases,
    });
  });

  it('handles unsorted phases by sorting by endDate', () => {
    const unsortedLifecycle: LifecycleData = {
      package: 'test',
      schema: 'test',
      versions: [
        {
          name: '1.0',
          phases: [
            {
              name: 'Extended life cycle support',
              startDate: '2024-07-01',
              endDate: '2025-06-30',
            },
            {
              name: 'Maintenance support',
              startDate: '2024-01-01',
              endDate: '2024-06-30',
            },
          ],
        },
      ],
    };
    const result = getSupportPhase(unsortedLifecycle, '1.0', new Date('2024-03-15'));
    expect(result.status).toBe(SupportPhaseStatus.Active);
    expect(result.currentPhase?.name).toBe('Maintenance support');
  });

  it('returns self-support for unsorted phases when all have ended', () => {
    const unsortedLifecycle: LifecycleData = {
      package: 'test',
      schema: 'test',
      versions: [
        {
          name: '1.0',
          phases: [
            {
              name: 'Extended life cycle support',
              startDate: '2024-07-01',
              endDate: '2025-06-30',
            },
            {
              name: 'Maintenance support',
              startDate: '2024-01-01',
              endDate: '2024-06-30',
            },
          ],
        },
      ],
    };
    const result = getSupportPhase(unsortedLifecycle, '1.0', new Date('2026-01-01'));
    expect(result).toEqual({
      status: SupportPhaseStatus.SelfSupport,
      allPhases: expect.arrayContaining([
        expect.objectContaining({ name: 'Maintenance support' }),
        expect.objectContaining({ name: 'Extended life cycle support' }),
      ]),
    });
  });
});

describe('ClusterCompatibilityStatus', () => {
  it('renders Compatible label', () => {
    render(<ClusterCompatibilityStatus compatible="compatible" />);
    expect(screen.getByText('Compatible')).toBeInTheDocument();
    expect(screen.getByTestId('cluster-compatibility-compatible')).toBeInTheDocument();
  });

  it('renders Incompatible label', () => {
    render(<ClusterCompatibilityStatus compatible="incompatible" />);
    expect(screen.getByText('Incompatible')).toBeInTheDocument();
    expect(screen.getByTestId('cluster-compatibility-incompatible')).toBeInTheDocument();
  });

  it('renders dash with aria-label when no data', () => {
    render(<ClusterCompatibilityStatus compatible="no-data" />);
    expect(screen.getByText('-')).toBeInTheDocument();
    const el = screen.getByTestId('cluster-compatibility-no-data');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-label', 'No data available');
  });
});

describe('SupportPhaseBadge', () => {
  const phases = [
    { name: 'Maintenance support', startDate: '2024-01-01', endDate: '2024-06-30' },
    { name: 'Extended life cycle support', startDate: '2024-07-01', endDate: '2025-12-31' },
  ];

  it('renders the current phase name and end date', () => {
    const phase = { status: SupportPhaseStatus.Active, currentPhase: phases[0], allPhases: phases };
    render(<SupportPhaseBadge phase={phase} />);
    expect(screen.getByText('Maintenance support')).toBeInTheDocument();
    expect(screen.getByText(/Jun 30, 2024/)).toBeInTheDocument();
    expect(screen.getByTestId('support-phase-badge')).toBeInTheDocument();
  });

  it('renders Self-support when phase is self-support', () => {
    render(
      <SupportPhaseBadge phase={{ status: SupportPhaseStatus.SelfSupport, allPhases: phases }} />,
    );
    expect(screen.getByText('Self-support')).toBeInTheDocument();
    expect(screen.getByTestId('support-phase-self-support')).toBeInTheDocument();
  });

  it('renders dash with aria-label when phase is no-data', () => {
    render(<SupportPhaseBadge phase={{ status: SupportPhaseStatus.NoData }} />);
    expect(screen.getByText('-')).toBeInTheDocument();
    const el = screen.getByTestId('support-phase-no-data');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-label', 'No data available');
  });
});
