import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { RebootingIcon } from '@patternfly/react-icons/dist/esm/icons/rebooting-icon';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { StatusIconAndText } from '@console/dynamic-plugin-sdk';
import {
  SectionHeading,
  humanizeDecimalBytes,
  ResourceLink,
} from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import type { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  getName,
  getMachineNode,
  getMachineNodeName,
  getNamespace,
  getMachineRole,
  DetailPropertyList,
  DetailPropertyListItem,
  SecondaryStatus,
  DASH,
} from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { HOST_REGISTERING_STATES } from '../../constants/bare-metal-host';
import {
  getHostNICs,
  getHostDescription,
  getHostBMCAddress,
  getHostCPU,
  getHostRAMMiB,
  getHostTotalStorageCapacity,
  getHostMachineName,
  getHostPowerStatus,
  getHostVendorInfo,
  getHostMachine,
  findNodeMaintenance,
  getHostBios,
  getHostProvisioningState,
  getHostBootMACAddress,
  isHostScheduledForRestart,
  hasPowerManagement,
  isDetached,
} from '../../selectors';
import { getHostStatus } from '../../status/host-status';
import type { BareMetalHostKind } from '../../types';
import BareMetalHostPowerStatusIcon from './BareMetalHostPowerStatusIcon';
import BareMetalHostStatus from './BareMetalHostStatus';
import MachineLink from './MachineLink';

const PowerStatus = ({ host }: { host: BareMetalHostKind }) => {
  const { t } = useTranslation();
  if (isDetached(host)) {
    return <SecondaryStatus status={t('metal3-plugin~Detached')} />;
  }

  if (!hasPowerManagement(host)) {
    return <SecondaryStatus status={t('metal3-plugin~No power management')} />;
  }

  const powerStatus = getHostPowerStatus(host);
  return (
    <>
      <StatusIconAndText
        title={powerStatus}
        icon={<BareMetalHostPowerStatusIcon powerStatus={powerStatus} />}
      />
      {isHostScheduledForRestart(host) && (
        <StatusIconAndText title={t('metal3-plugin~Restart pending')} icon={<RebootingIcon />} />
      )}
    </>
  );
};

type BareMetalHostDetailsProps = {
  obj: BareMetalHostKind;
  machines: MachineKind[];
  nodes: NodeKind[];
  nodeMaintenances: K8sResourceKind[];
};

const BareMetalHostDetails: FC<BareMetalHostDetailsProps> = ({
  obj: host,
  machines,
  nodes,
  nodeMaintenances,
}) => {
  const { t } = useTranslation();
  const { creationTimestamp } = host.metadata;
  const namespace = getNamespace(host);
  const nics = getHostNICs(host);
  const ips = nics.map((nic) => nic.ip).join(', ');
  const machineName = getHostMachineName(host);
  const machine = getHostMachine(host, machines);
  const nodeName = getMachineNodeName(machine);
  const node = getMachineNode(machine, nodes);
  const role = getMachineRole(machine);
  const hostRAM = getHostRAMMiB(host);
  const RAMGB = hostRAM ? humanizeDecimalBytes(hostRAM * 2 ** 20).string : DASH;
  const hostStorage = getHostTotalStorageCapacity(host);
  const totalStorageCapacity = hostStorage ? humanizeDecimalBytes(hostStorage).string : DASH;
  const description = getHostDescription(host);
  const provisioningState = getHostProvisioningState(host);
  const { count: CPUCount, model: CPUModel } = getHostCPU(host);
  const { manufacturer, productName, serialNumber } = getHostVendorInfo(host);
  const bios = getHostBios(host);

  const nodeMaintenance = findNodeMaintenance(nodeMaintenances, nodeName);
  const status = getHostStatus({ host, machine, node, nodeMaintenance });

  return (
    <PaneBody>
      <SectionHeading text={t('metal3-plugin~Bare Metal Host Details')} />
      <Grid hasGutter>
        <GridItem sm={6} id="name-description-column">
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('metal3-plugin~Name')}</DescriptionListTerm>
              <DescriptionListDescription>{getName(host)}</DescriptionListDescription>
            </DescriptionListGroup>
            {description && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('metal3-plugin~Description')}</DescriptionListTerm>
                <DescriptionListDescription>{description}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>{t('metal3-plugin~Host Addresses')}</DescriptionListTerm>
              <DescriptionListDescription>
                <DetailPropertyList>
                  <DetailPropertyListItem title="Management">
                    {getHostBMCAddress(host) || DASH}
                  </DetailPropertyListItem>
                  <DetailPropertyListItem title="NICs">{ips}</DetailPropertyListItem>
                  <DetailPropertyListItem title="Boot Interface MAC">
                    {getHostBootMACAddress(host)}
                  </DetailPropertyListItem>
                </DetailPropertyList>
              </DescriptionListDescription>
            </DescriptionListGroup>
            {machineName && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('metal3-plugin~Machine')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <MachineLink host={host} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {nodeName && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('metal3-plugin~Node')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <ResourceLink
                    kind={referenceForModel(NodeModel)}
                    name={nodeName}
                    namespace={namespace}
                    title={nodeName}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>{t('metal3-plugin~Created at')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp timestamp={creationTimestamp} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>
        <GridItem sm={6}>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('metal3-plugin~Status')}</DescriptionListTerm>
              <DescriptionListDescription>
                <BareMetalHostStatus {...status} nodeMaintenance={nodeMaintenance} host={host} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            {/* power status is not available until host registration/inspection is finished */}
            {!HOST_REGISTERING_STATES.includes(provisioningState) && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('metal3-plugin~Power Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <PowerStatus host={host} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {role && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('metal3-plugin~Role')}</DescriptionListTerm>
                <DescriptionListDescription>{role}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {(manufacturer || productName) && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('metal3-plugin~Model')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {_.filter([manufacturer, productName]).join(', ')}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {bios && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('metal3-plugin~Bios')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <DetailPropertyList>
                    <DetailPropertyListItem title="Version">
                      {bios.version || DASH}
                    </DetailPropertyListItem>
                    <DetailPropertyListItem title="Vendor">
                      {bios.vendor || DASH}
                    </DetailPropertyListItem>
                    <DetailPropertyListItem title="Date">
                      {bios.date || DASH}
                    </DetailPropertyListItem>
                  </DetailPropertyList>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {serialNumber && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('metal3-plugin~Serial Number')}</DescriptionListTerm>
                <DescriptionListDescription>{serialNumber}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {_.get(host, 'status.hardware') && (
              <DescriptionListGroup>
                <DescriptionListTerm>{t('metal3-plugin~Hardware')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <DetailPropertyList>
                    <DetailPropertyListItem title={t('metal3-plugin~CPU')}>
                      {CPUCount ? `${CPUCount}x ${CPUModel}` : DASH}
                    </DetailPropertyListItem>
                    <DetailPropertyListItem title={t('metal3-plugin~RAM')}>
                      {RAMGB}
                    </DetailPropertyListItem>
                    <DetailPropertyListItem title={t('metal3-plugin~Storage')}>
                      {totalStorageCapacity}
                    </DetailPropertyListItem>
                  </DetailPropertyList>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export default BareMetalHostDetails;
