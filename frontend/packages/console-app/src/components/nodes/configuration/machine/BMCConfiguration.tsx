import type { FC } from 'react';
import {
  Alert,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from '@console/internal/components/utils';
import type { K8sResourceKind, NodeKind } from '@console/internal/module/k8s';
import { DASH, DetailPropertyList, DetailPropertyListItem } from '@console/shared/src';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  HOST_STATUS_UNMANAGED,
  HOST_STATUS_DETACHED,
  useIsBareMetalPluginActive,
  useWatchBareMetalHost,
  getPoweroffAnnotation,
  isHostOnline,
  isHostPoweredOn,
  isHostScheduledForRestart,
} from '../../utils/NodeBareMetalUtils';

const SkeletonDetails: FC = () => (
  <div data-test="skeleton-detail-view" className="skeleton-detail-view">
    <div className="skeleton-detail-view--head" />
    <div className="skeleton-detail-view--grid">
      <div className="skeleton-detail-view--column">
        <div className="skeleton-detail-view--tile skeleton-detail-view--tile-plain" />
        <div className="skeleton-detail-view--tile skeleton-detail-view--tile-plain" />
      </div>
    </div>
  </div>
);

type ConfigPropertyListItemProps = {
  title: string;
  isLoading: boolean;
  children?: React.ReactNode;
};

const ConfigPropertyListItem: FC<ConfigPropertyListItemProps> = ({ title, children, isLoading }) =>
  isLoading ? (
    <div className="skeleton-text pf-v6-u-w-25" />
  ) : (
    <DetailPropertyListItem title={title}>{children}</DetailPropertyListItem>
  );

type HostAddressesProps = {
  bareMetalHost: K8sResourceKind;
  isLoading: boolean;
};

const HostAddresses: FC<HostAddressesProps> = ({ bareMetalHost, isLoading }) => {
  const { t } = useTranslation();

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('console-app~Host addresses')}</DescriptionListTerm>
        <DescriptionListDescription>
          <DetailPropertyList>
            <ConfigPropertyListItem title={t('console-app~Management')} isLoading={isLoading}>
              {bareMetalHost?.spec?.bmc?.address ?? DASH}
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('console-app~NICs')} isLoading={isLoading}>
              {
                // Intentionally include blank nics
                bareMetalHost?.status?.hardware?.nics?.map((nic) => nic.ip).join(', ') || DASH
              }
            </ConfigPropertyListItem>
            <ConfigPropertyListItem
              title={t('console-app~Boot interface MAC')}
              isLoading={isLoading}
            >
              {bareMetalHost?.spec?.bootMACAddress ?? DASH}
            </ConfigPropertyListItem>
          </DetailPropertyList>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

const hostPowerStatus = (host: K8sResourceKind, t: TFunction) => {
  if (host.status?.operationalStatus === HOST_STATUS_DETACHED) {
    return t('console-app~Detached');
  }

  if (host.status?.provisioning?.state === HOST_STATUS_UNMANAGED) {
    return t('console-app~No power management');
  }

  if (isHostScheduledForRestart(host)) {
    return t('console-app~Restart pending');
  }

  const isOnline = isHostOnline(host);
  const isPoweredOn = isHostPoweredOn(host);
  const poweroffAnnotation = getPoweroffAnnotation(host);
  if (isOnline && isPoweredOn && !poweroffAnnotation) return t('console-app~On');
  if ((!isOnline || poweroffAnnotation) && isPoweredOn) return t('console-app~Powering off');
  if (isOnline && !isPoweredOn && !poweroffAnnotation) return t('console-app~Powering on');
  return t('console-app~Off');
};

type BMCDetailsProps = {
  bareMetalHost: K8sResourceKind;
  isLoading: boolean;
};

const BMCConfigDetails: FC<BMCDetailsProps> = ({ bareMetalHost, isLoading }) => {
  const { t } = useTranslation();

  const bmcAddress = bareMetalHost?.spec?.bmc?.address;
  const protocolRaw = bmcAddress?.split('://')?.[0]?.toLowerCase();
  const protocol = protocolRaw?.includes('redfish')
    ? 'Redfish'
    : protocolRaw?.includes('idrac')
    ? 'iDRAC'
    : protocolRaw
    ? protocolRaw.toUpperCase()
    : undefined;
  const manufacturer = bareMetalHost?.status?.hardware?.systemVendor?.manufacturer;
  const productName = bareMetalHost?.status?.hardware?.systemVendor?.productName;
  const hardwareType = [manufacturer, productName].filter(Boolean).join(' ');
  const firmwareVersion =
    bareMetalHost?.status?.hardware?.firmware?.bmcVersion ??
    bareMetalHost?.status?.hardware?.firmware?.bios?.version;
  const bmcType = [hardwareType, protocol ? `(${protocol})` : undefined].filter(Boolean).join(' ');

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('console-app~Details')}</DescriptionListTerm>
        <DescriptionListDescription>
          <DetailPropertyList>
            <ConfigPropertyListItem title={t('console-app~Type')} isLoading={isLoading}>
              {bmcType || DASH}
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('console-app~Address')} isLoading={isLoading}>
              {bmcAddress ?? DASH}
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('console-app~Firmware')} isLoading={isLoading}>
              {firmwareVersion ?? DASH}
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('console-app~Power state')} isLoading={isLoading}>
              {bareMetalHost ? hostPowerStatus(bareMetalHost, t) : DASH}
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('console-app~Credentials')} isLoading={isLoading}>
              {bareMetalHost?.status?.goodCredentials?.credentials?.name
                ? `${bareMetalHost.status.goodCredentials.credentials.name} ${
                    bareMetalHost.status.goodCredentials.credentials.namespace
                      ? `(${t('console-app~namespace {{namespace}}', {
                          namespace: bareMetalHost.status.goodCredentials.credentials.namespace,
                        })})`
                      : ''
                  }`
                : DASH}
            </ConfigPropertyListItem>
          </DetailPropertyList>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

type BMCConfigurationProps = {
  node: NodeKind;
};

const BMCConfiguration: FC<BMCConfigurationProps> = ({ node }) => {
  const { t } = useTranslation();

  const showBareMetal = useIsBareMetalPluginActive();

  const [bareMetalHost, bareMetalHostLoaded, bareMetalHostLoadError] = useWatchBareMetalHost(node);

  if (!showBareMetal) {
    return null;
  }

  return (
    <PaneBody>
      <SectionHeading text={t('console-app~BMC Configuration')} />
      {bareMetalHostLoadError ? (
        <Alert variant="danger" title={t('console-app~Unable to load BMC configuration')}>
          <p>{bareMetalHostLoadError.message ?? null}</p>
        </Alert>
      ) : !bareMetalHostLoaded ? (
        <SkeletonDetails />
      ) : !bareMetalHost ? (
        <Content>
          {t('console-app~There is no BMC configuration associated with this node')}
        </Content>
      ) : (
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <HostAddresses
              isLoading={!bareMetalHostLoaded && !bareMetalHostLoadError}
              bareMetalHost={bareMetalHost}
            />
          </FlexItem>
          <FlexItem>
            <BMCConfigDetails
              isLoading={!bareMetalHostLoaded && !bareMetalHostLoadError}
              bareMetalHost={bareMetalHost}
            />
          </FlexItem>
        </Flex>
      )}
    </PaneBody>
  );
};

export default BMCConfiguration;
