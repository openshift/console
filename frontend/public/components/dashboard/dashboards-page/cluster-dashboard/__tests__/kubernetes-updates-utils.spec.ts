import type { KubernetesRelease } from '../kubernetes-updates-utils';
import {
  getEOLStatus,
  getKubernetesUpdateInfo,
  parseKubernetesVersion,
} from '../kubernetes-updates-utils';

const releases: KubernetesRelease[] = [
  { cycle: '1.35', latest: '1.35.1', releaseDate: '2025-12-17', eol: '2027-02-28' },
  { cycle: '1.34', latest: '1.34.4', releaseDate: '2025-08-27', eol: '2026-10-27' },
  { cycle: '1.33', latest: '1.33.7', releaseDate: '2025-04-23', eol: '2026-06-28' },
  { cycle: '1.32', eol: null },
];

const now = new Date(2026, 0, 15);

describe('parseKubernetesVersion', () => {
  it.each([
    ['v1.33.2', { major: 1, minor: 33, patch: 2 }],
    ['1.33.2', { major: 1, minor: 33, patch: 2 }],
    ['v1.33.2+k3s1', { major: 1, minor: 33, patch: 2 }],
    ['v1.33.2-eks-1234567', { major: 1, minor: 33, patch: 2 }],
  ])('parses %s', (version, expected) => {
    expect(parseKubernetesVersion(version)).toEqual(expected);
  });

  it.each([undefined, '', 'v1.33', 'latest', 'x1.33.2'])('rejects %p', (version) => {
    expect(parseKubernetesVersion(version)).toBeNull();
  });
});

describe('getEOLStatus', () => {
  const eol = new Date(2026, 5, 28);
  const daysBefore = (days: number) => new Date(2026, 5, 28 - days, 13, 45);

  it('is ok more than 30 days before EOL', () => {
    expect(getEOLStatus(eol, daysBefore(31))).toBe('ok');
  });

  it('warns exactly 30 days before EOL', () => {
    expect(getEOLStatus(eol, daysBefore(30))).toBe('warning');
  });

  it('warns on the EOL date itself', () => {
    expect(getEOLStatus(eol, daysBefore(0))).toBe('warning');
  });

  it('is danger the day after EOL', () => {
    expect(getEOLStatus(eol, daysBefore(-1))).toBe('danger');
  });
});

describe('getKubernetesUpdateInfo', () => {
  it('returns null for an unparseable cluster version', () => {
    expect(getKubernetesUpdateInfo('unknown', releases, now)).toBeNull();
  });

  it('reports a newer patch and a newer minor', () => {
    expect(getKubernetesUpdateInfo('v1.33.2+k3s1', releases, now)).toEqual({
      cycle: '1.33',
      cycleKnown: true,
      latestPatch: '1.33.7',
      latestRelease: '1.35.1',
      eol: new Date(2026, 5, 28),
      eolStatus: 'ok',
      updateAvailable: true,
    });
  });

  it('omits the patch when the cluster already runs it', () => {
    const info = getKubernetesUpdateInfo('v1.33.7', releases, now);
    expect(info.latestPatch).toBeUndefined();
    expect(info.latestRelease).toBe('1.35.1');
  });

  it('reports nothing newer on the latest release', () => {
    const info = getKubernetesUpdateInfo('v1.35.1-eks-abc', releases, now);
    expect(info.latestPatch).toBeUndefined();
    expect(info.latestRelease).toBeUndefined();
    expect(info.updateAvailable).toBe(false);
  });

  it('compares minors numerically, not as strings', () => {
    const info = getKubernetesUpdateInfo('v1.9.0', [
      { cycle: '1.10', latest: '1.10.0', eol: null },
    ]);
    expect(info.latestRelease).toBe('1.10.0');
  });

  it('handles a cycle missing from the release list', () => {
    const info = getKubernetesUpdateInfo('v1.36.0', releases, now);
    expect(info).toEqual({
      cycle: '1.36',
      cycleKnown: false,
      latestPatch: undefined,
      latestRelease: undefined,
      eol: undefined,
      eolStatus: undefined,
      updateAvailable: false,
    });
  });

  it('has no EOL when the cycle has no EOL date', () => {
    const info = getKubernetesUpdateInfo('v1.32.1', releases, now);
    expect(info.cycleKnown).toBe(true);
    expect(info.eol).toBeUndefined();
    expect(info.eolStatus).toBeUndefined();
  });

  it('flags an EOL in the past as danger', () => {
    expect(getKubernetesUpdateInfo('v1.33.7', releases, new Date(2026, 6, 1)).eolStatus).toBe(
      'danger',
    );
  });
});
