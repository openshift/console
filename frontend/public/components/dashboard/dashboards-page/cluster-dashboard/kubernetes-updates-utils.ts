/** One Kubernetes minor line, as served by /api/console/kubernetes-releases. */
export type KubernetesRelease = {
  cycle: string;
  latest?: string;
  releaseDate?: string;
  /** End-of-life date as YYYY-MM-DD, or null when unknown. */
  eol: string | null;
};

export type KubernetesReleasesResponse = {
  releases: KubernetesRelease[];
  fetchedAt: string;
};

export type EOLStatus = 'ok' | 'warning' | 'danger';

export type KubernetesUpdateInfo = {
  /** The cluster's minor line, e.g. "1.33". */
  cycle: string;
  /** False when the release list has no entry for the cluster's minor line. */
  cycleKnown: boolean;
  /** Latest patch of the cluster's minor line, set only when newer than the cluster. */
  latestPatch?: string;
  /** Latest release overall, set only when its minor line is newer than the cluster's. */
  latestRelease?: string;
  eol?: Date;
  eolStatus?: EOLStatus;
  updateAvailable: boolean;
};

export const EOL_WARNING_DAYS = 30;

type Version = { major: number; minor: number; patch: number };

/** Parses "v1.33.2", "1.33.2+k3s1" or "v1.33.2-eks-1234" into numbers. */
export const parseKubernetesVersion = (version?: string): Version | null => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version?.trim() ?? '');
  return match ? { major: +match[1], minor: +match[2], patch: +match[3] } : null;
};

const compareMinor = (a: Version, b: Version) => a.major - b.major || a.minor - b.minor;

/** Parses YYYY-MM-DD as local midnight, so the formatted date matches the source. */
const parseDate = (date: string): Date | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? new Date(+match[1], +match[2] - 1, +match[3]) : undefined;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** danger once the EOL date has passed, warning on it and up to EOL_WARNING_DAYS before it. */
export const getEOLStatus = (eol: Date, now: Date): EOLStatus => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.round((eol.getTime() - today.getTime()) / DAY_MS);
  if (daysLeft < 0) {
    return 'danger';
  }
  return daysLeft <= EOL_WARNING_DAYS ? 'warning' : 'ok';
};

/** Returns null when the cluster version cannot be parsed. */
export const getKubernetesUpdateInfo = (
  clusterVersion: string | undefined,
  releases: KubernetesRelease[],
  now: Date = new Date(),
): KubernetesUpdateInfo | null => {
  const current = parseKubernetesVersion(clusterVersion);
  if (!current) {
    return null;
  }
  const cycle = `${current.major}.${current.minor}`;
  const currentRelease = releases.find((r) => r.cycle === cycle);

  const currentLatest = parseKubernetesVersion(currentRelease?.latest);
  const latestPatch =
    currentLatest && currentLatest.patch > current.patch ? currentRelease.latest : undefined;

  const newest = releases
    .map((r) => ({ latest: r.latest, version: parseKubernetesVersion(r.latest) }))
    .filter((r) => r.version)
    .reduce((a, b) => (!a || compareMinor(b.version, a.version) > 0 ? b : a), undefined);
  const latestRelease =
    newest && compareMinor(newest.version, current) > 0 ? newest.latest : undefined;

  const eol = currentRelease?.eol ? parseDate(currentRelease.eol) : undefined;

  return {
    cycle,
    cycleKnown: !!currentRelease,
    latestPatch,
    latestRelease,
    eol,
    eolStatus: eol ? getEOLStatus(eol, now) : undefined,
    updateAvailable: !!latestPatch || !!latestRelease,
  };
};
