export type LifecycleData = {
  package: string;
  schema: string;
  versions?: {
    name: string;
    platformCompatibility?: { name: string; versions: string[] }[];
    phases?: { name: string; startDate: string; endDate: string }[];
  }[];
};

const LIFECYCLE_SCHEMA = 'io.openshift.operators.lifecycles.v1alpha1';

const toDateStr = (d: Date): string => d.toISOString().slice(0, 10);

const activePhases = (): { name: string; startDate: string; endDate: string }[] => {
  const now = new Date();
  const maintenanceStart = new Date(now.getFullYear() - 1, 0, 1);
  const maintenanceEnd = new Date(now.getFullYear() + 1, 5, 30);
  const extendedStart = new Date(maintenanceEnd);
  extendedStart.setDate(extendedStart.getDate() + 1);
  const extendedEnd = new Date(now.getFullYear() + 3, 11, 31);
  return [
    { name: 'Maintenance support', startDate: toDateStr(maintenanceStart), endDate: toDateStr(maintenanceEnd) },
    { name: 'Extended life cycle support', startDate: toDateStr(extendedStart), endDate: toDateStr(extendedEnd) },
  ];
};

const expiredPhases = (): { name: string; startDate: string; endDate: string }[] => {
  const now = new Date();
  const maintenanceStart = new Date(now.getFullYear() - 3, 0, 1);
  const maintenanceEnd = new Date(now.getFullYear() - 2, 5, 30);
  const extendedStart = new Date(maintenanceEnd);
  extendedStart.setDate(extendedStart.getDate() + 1);
  const extendedEnd = new Date(now.getFullYear() - 1, 11, 31);
  return [
    { name: 'Maintenance support', startDate: toDateStr(maintenanceStart), endDate: toDateStr(maintenanceEnd) },
    { name: 'Extended life cycle support', startDate: toDateStr(extendedStart), endDate: toDateStr(extendedEnd) },
  ];
};

export const makeLifecycleActiveAndCompatible = (
  packageName: string,
  version: string,
  clusterVersion: string,
): LifecycleData => ({
  package: packageName,
  schema: LIFECYCLE_SCHEMA,
  versions: [
    {
      name: version,
      platformCompatibility: [{ name: 'openshift', versions: [clusterVersion] }],
      phases: activePhases(),
    },
  ],
});

export const makeLifecycleSelfSupport = (
  packageName: string,
  version: string,
  clusterVersion: string,
): LifecycleData => ({
  package: packageName,
  schema: LIFECYCLE_SCHEMA,
  versions: [
    {
      name: version,
      platformCompatibility: [{ name: 'openshift', versions: [clusterVersion] }],
      phases: expiredPhases(),
    },
  ],
});

export const makeLifecycleIncompatible = (
  packageName: string,
  version: string,
): LifecycleData => ({
  package: packageName,
  schema: LIFECYCLE_SCHEMA,
  versions: [
    {
      name: version,
      platformCompatibility: [{ name: 'openshift', versions: ['4.99'] }],
      phases: activePhases(),
    },
  ],
});
