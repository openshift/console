import * as React from 'react';
import { RebootingIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  SectionHeading,
  Timestamp,
  humanizeDecimalBytes,
  ResourceLink,
} from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import {
  referenceForModel,
  K8sResourceKind,
  MachineKind,
  NodeKind,
} from '@console/internal/module/k8s';
import {
  getName,
  getMachineNode,
  getMachineNodeName,
  getNamespace,
  getMachineRole,
  StatusIconAndText,
  DetailPropertyList,
  DetailPropertyListItem,
  SecondaryStatus,
  DASH,
} from '@console/shared';
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
} from '../../selectors';
import { getHostStatus } from '../../status/host-status';
import { BareMetalHostKind } from '../../types';
import BareMetalHostPowerStatusIcon from './BareMetalHostPowerStatusIcon';
import BareMetalHostStatus from './BareMetalHostStatus';
import MachineLink from './MachineLink';

type BareMetalHostDetailsProps = {
  obj: BareMetalHostKind;
  machines: MachineKind[];
  nodes: NodeKind[];
  nodeMaintenances: K8sResourceKind[];
};

const BareMetalHostDetails: React.FC<BareMetalHostDetailsProps> = ({
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
  const powerStatus = getHostPowerStatus(host);
  const provisioningState = getHostProvisioningState(host);
  const { count: CPUCount, model: CPUModel } = getHostCPU(host);
  const { manufacturer, productName, serialNumber } = getHostVendorInfo(host);
  const bios = getHostBios(host);

  const nodeMaintenance = findNodeMaintenance(nodeMaintenances, nodeName);
  const status = getHostStatus({ host, machine, node, nodeMaintenance });

  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('metal3-plugin~Bare Metal Host Details')} />
      <div className="row">
        <div className="col-xs-12 col-sm-6" id="name-description-column">
          <dl>
            <dt>{t('metal3-plugin~Name')}</dt>
            <dd>{getName(host)}</dd>
            {description && (
              <>
                <dt>{t('metal3-plugin~Description')}</dt>
                <dd>{description}</dd>
              </>
            )}
            <dt>{t('metal3-plugin~Host Addresses')}</dt>
            <dd>
              <DetailPropertyList>
                <DetailPropertyListItem title="Management">
                  {getHostBMCAddress(host) || DASH}
                </DetailPropertyListItem>
                <DetailPropertyListItem title="NICs">{ips}</DetailPropertyListItem>
                <DetailPropertyListItem title="Boot Interface MAC">
                  {getHostBootMACAddress(host)}
                </DetailPropertyListItem>
              </DetailPropertyList>
            </dd>
            {machineName && (
              <>
                <dt>{t('metal3-plugin~Machine')}</dt>
                <dd>
                  <MachineLink host={host} />
                </dd>
              </>
            )}
            {nodeName && (
              <>
                <dt>{t('metal3-plugin~Node')}</dt>
                <dd>
                  <ResourceLink
                    kind={referenceForModel(NodeModel)}
                    name={nodeName}
                    namespace={namespace}
                    title={nodeName}
                  />
                </dd>
              </>
            )}
            <dt>{t('metal3-plugin~Created at')}</dt>
            <dd>
              <Timestamp timestamp={creationTimestamp} />
            </dd>
          </dl>
        </div>
        <div className="col-xs-12 col-sm-6">
          <dl>
            <dt>{t('metal3-plugin~Status')}</dt>
            <dd>
              <BareMetalHostStatus {...status} nodeMaintenance={nodeMaintenance} host={host} />
            </dd>
            {/* power status is not available until host registration/inspection is finished */}
            {!HOST_REGISTERING_STATES.includes(provisioningState) && (
              <>
                <dt>{t('metal3-plugin~Power Status')}</dt>
                <dd>
                  {!hasPowerManagement(host) ? (
                    <SecondaryStatus status={t('metal3-plugin~No power management')} />
                  ) : (
                    <>
                      <StatusIconAndText
                        title={powerStatus}
                        icon={<BareMetalHostPowerStatusIcon powerStatus={powerStatus} />}
                      />
                      {isHostScheduledForRestart(host) && (
                        <StatusIconAndText
                          title={t('metal3-plugin~Restart pending')}
                          icon={<RebootingIcon />}
                        />
                      )}
                    </>
                  )}
                </dd>
              </>
            )}
            {role && (
              <>
                <dt>{t('metal3-plugin~Role')}</dt>
                <dd>{role}</dd>
              </>
            )}
            {(manufacturer || productName) && (
              <>
                <dt>{t('metal3-plugin~Model')}</dt>
                <dd>{_.filter([manufacturer, productName]).join(', ')}</dd>
              </>
            )}
            {bios && (
              <>
                <dt>{t('metal3-plugin~Bios')}</dt>
                <dd>
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
                </dd>
              </>
            )}
            {serialNumber && (
              <>
                <dt>{t('metal3-plugin~Serial Number')}</dt>
                <dd>{serialNumber}</dd>
              </>
            )}
            {_.get(host, 'status.hardware') && (
              <>
                <dt>{t('metal3-plugin~Hardware')}</dt>
                <dd>
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
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default BareMetalHostDetails;
