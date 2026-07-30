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
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailPropertyList } from '@console/shared/src/components/lists/DetailPropertyList';
import { DetailPropertyListItem } from '@console/shared/src/components/lists/DetailPropertyListItem';
import { DASH } from '@console/shared/src/constants/ui';
import {
  HOST_STATUS_UNMANAGED,
  HOST_STATUS_DETACHED,
  useIsBareMetalPluginActive,
  useWatchBareMetalHost,
  getRebootAnnotation,
  isHostOnline,
  isHostPoweredOn,
  isHostScheduledForRestart,
} from '../../utils/NodeBareMetalUtils';

type ConfigPropertyListItemProps = {
  title: string;
  isLoading: boolean;
  children?: React.ReactNode;
};

const ConfigPropertyListItem: FC<ConfigPropertyListItemProps> = ({ title, children, isLoading }) =>
  isLoading ? (
    <div className="skeleton-text pf-v6-u-w-25" data-test="config-property-skeleton" />
  ) : (
    <DetailPropertyListItem title={title}>{children}</DetailPropertyListItem>
  );

type HostAddressesProps = {
  bareMetalHost: K8sResourceKind;
  isLoading: boolean;
};

const HostAddresses: FC<HostAddressesProps> = ({ bareMetalHost, isLoading }) => {
  const { t } = useTranslation('console-app');

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Host addresses')}</DescriptionListTerm>
        <DescriptionListDescription>
          <DetailPropertyList>
            <ConfigPropertyListItem title={t('Management')} isLoading={isLoading}>
              {bareMetalHost?.spec?.bmc?.address ?? DASH}
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('NICs')} isLoading={isLoading}>
              {
                // Intentionally include blank nics
                bareMetalHost?.status?.hardware?.nics?.map((nic) => nic.ip ?? '').join(', ') || DASH
              }
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('Boot interface MAC')} isLoading={isLoading}>
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
    return t('Detached');
  }

  if (host.status?.provisioning?.state === HOST_STATUS_UNMANAGED) {
    return t('No power management');
  }

  if (isHostScheduledForRestart(host)) {
    return t('Restart pending');
  }

  const isOnline = isHostOnline(host);
  const isPoweredOn = isHostPoweredOn(host);
  const rebootAnnotation = getRebootAnnotation(host);
  if (isOnline && isPoweredOn && !rebootAnnotation) return t('On');
  if ((!isOnline || rebootAnnotation) && isPoweredOn) return t('Powering off');
  if (isOnline && !isPoweredOn && !rebootAnnotation) return t('Powering on');
  return t('Off');
};

type BMCDetailsProps = {
  bareMetalHost: K8sResourceKind;
  isLoading: boolean;
};

const BMCConfigDetails: FC<BMCDetailsProps> = ({ bareMetalHost, isLoading }) => {
  const { t } = useTranslation('console-app');

  const bmcAddress = bareMetalHost?.spec?.bmc?.address;
  const protocolRaw = bmcAddress?.includes('://')
    ? bmcAddress.split('://')[0].toLowerCase()
    : undefined;
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
        <DescriptionListTerm>{t('Details')}</DescriptionListTerm>
        <DescriptionListDescription>
          <DetailPropertyList>
            <ConfigPropertyListItem title={t('Type')} isLoading={isLoading}>
              {bmcType || DASH}
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('Address')} isLoading={isLoading}>
              {bmcAddress ?? DASH}
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('Firmware')} isLoading={isLoading}>
              {firmwareVersion ?? DASH}
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('Power state')} isLoading={isLoading}>
              {bareMetalHost ? hostPowerStatus(bareMetalHost, t) : DASH}
            </ConfigPropertyListItem>
            <ConfigPropertyListItem title={t('Credentials')} isLoading={isLoading}>
              {bareMetalHost?.status?.goodCredentials?.credentials?.name
                ? `${bareMetalHost.status.goodCredentials.credentials.name} ${
                    bareMetalHost.status.goodCredentials.credentials.namespace
                      ? `(${t('namespace {{namespace}}', {
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
  const { t } = useTranslation('console-app');

  const showBareMetal = useIsBareMetalPluginActive();

  const [bareMetalHost, bareMetalHostLoaded, bareMetalHostLoadError] = useWatchBareMetalHost(node);

  return (
    <PaneBody>
      <SectionHeading text={t('BMC Configuration')} />
      {!showBareMetal ? (
        <Alert variant="info" isInline title={t('Unable to load BMC configuration')}>
          <p>{t('Bare Metal is not configured for this cluster.')}</p>
        </Alert>
      ) : bareMetalHostLoadError ? (
        <Alert variant="danger" isInline title={t('Unable to load BMC configuration')}>
          <p>{bareMetalHostLoadError.message ?? null}</p>
        </Alert>
      ) : !bareMetalHost && bareMetalHostLoaded ? (
        <Content>{t('This node does not have an associated BMC configuration.')}</Content>
      ) : (
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <HostAddresses isLoading={!bareMetalHostLoaded} bareMetalHost={bareMetalHost} />
          </FlexItem>
          <FlexItem>
            <BMCConfigDetails isLoading={!bareMetalHostLoaded} bareMetalHost={bareMetalHost} />
          </FlexItem>
        </Flex>
      )}
    </PaneBody>
  );
};

export default BMCConfiguration;
