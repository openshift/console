import type { K8sResourceCommon } from '@console/internal/module/k8s';
import { LabelSelector } from '@console/internal/module/k8s';
import { OLMAnnotation } from '../components/operator-hub';
import { NON_STANDALONE_ANNOTATION_VALUE } from '../const';
import type { CSVDescription, PackageManifestKind } from '../types';

const OperatingSystemLabelPrefix = 'operatorframework.io/os.';
const ArchitectureLabelPrefix = 'operatorframework.io/arch.';
const operatingSystems = window.SERVER_FLAGS.nodeOperatingSystems ?? [];
const architectures = window.SERVER_FLAGS.nodeArchitectures ?? [];

const OperatingSystemLabelSelectors = operatingSystems.map(
  (os) =>
    new LabelSelector({ matchLabels: { [`${OperatingSystemLabelPrefix}${os}`]: 'supported' } }),
);

const ArchitectureLabelSelectors = architectures.map(
  (arch) =>
    new LabelSelector({ matchLabels: { [`operatorframework.io/arch.${arch}`]: 'supported' } }),
);

const hasLabelWithPrefix = (obj: K8sResourceCommon, prefix: string) => {
  return Object.keys(obj.metadata.labels || {}).some((label) => label.startsWith(prefix));
};

const isOperatingSystemSupported = (pkg: PackageManifestKind) =>
  !hasLabelWithPrefix(pkg, OperatingSystemLabelPrefix) ||
  OperatingSystemLabelSelectors.length === 0 ||
  OperatingSystemLabelSelectors.some((selector) => selector.matches(pkg));

const isArchitectureSupported = (pkg: PackageManifestKind) =>
  !hasLabelWithPrefix(pkg, ArchitectureLabelPrefix) ||
  ArchitectureLabelSelectors.length === 0 ||
  ArchitectureLabelSelectors.some((selector) => selector.matches(pkg));

export const getCurrentCSVDescription = (
  pkg: PackageManifestKind,
  channel?: string,
): CSVDescription => {
  const desiredChannel = channel || pkg?.status?.defaultChannel;
  return (pkg?.status?.channels || []).find(
    ({ name }) => desiredChannel && name && desiredChannel === name,
  )?.currentCSVDesc;
};
const isStandaloneOperator = (pkg: PackageManifestKind) => {
  const { channels, defaultChannel } = pkg.status ?? {};
  // if a package does not have status.defaultChannel, exclude it so the app doesn't fail
  if (!defaultChannel) {
    // eslint-disable-next-line no-console
    console.warn(
      `PackageManifest ${pkg.metadata.name} has no status.defaultChannel and has been excluded`,
    );
    return false;
  }

  const { currentCSVDesc } = channels.find((ch) => ch.name === defaultChannel);
  // if CSV contains annotation for a non-standalone operator, filter it out
  return !(
    currentCSVDesc.annotations?.[OLMAnnotation.OperatorType] === NON_STANDALONE_ANNOTATION_VALUE
  );
};

export const operatorHubPackageFilter = (pkg: PackageManifestKind) =>
  isStandaloneOperator(pkg) && isOperatingSystemSupported(pkg) && isArchitectureSupported(pkg);
