import * as React from 'react';
import * as _ from 'lodash';
import { RebootingIcon } from '@patternfly/react-icons';
import {
  referenceForModel,
  K8sResourceKind,
  MachineKind,
  NodeKind,
} from '@console/internal/module/k8s';
import {
  SectionHeading,
  Timestamp,
  humanizeDecimalBytes,
  ResourceLink,
} from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import {
  getName,
  getMachineNode,
  getMachineNodeName,
  getNamespace,
  getMachineRole,
  StatusIconAndText,
  DetailPropertyList,
  DetailPropertyListItem,
} from '@console/shared';
import { getHostStatus } from '../../status/host-status';
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
} from '../../selectors';
import { BareMetalHostKind } from '../../types';
import { HOST_REGISTERING_STATES } from '../../constants/bare-metal-host';
import MachineLink from './MachineLink';
import BareMetalHostPowerStatusIcon from './BareMetalHostPowerStatusIcon';
import BareMetalHostStatus from './BareMetalHostStatus';
import { HOST_SCHEDULED_FOR_RESTART } from './BareMetalHostSecondaryStatus';

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
  const { creationTimestamp } = host.metadata;
  const namespace = getNamespace(host);
  const nics = getHostNICs(host);
  const ips = nics.map((nic) => nic.ip).join(', ');
  const machineName = getHostMachineName(host);
  const machine = getHostMachine(host, machines);
  const nodeName = getMachineNodeName(machine);
  const node = getMachineNode(machine, nodes);
  const role = getMachineRole(machine);
  const RAMGB = humanizeDecimalBytes(getHostRAMMiB(host) * 2 ** 20).string;
  const totalStorageCapacity = humanizeDecimalBytes(getHostTotalStorageCapacity(host)).string;
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
      <SectionHeading text="Bare Metal Host Details" />
      <div className="row">
        <div className="col-xs-12 col-sm-6" id="name-description-column">
          <dl>
            <dt>Name</dt>
            <dd>{getName(host)}</dd>
            {description && (
              <>
                <dt>Description</dt>
                <dd>{description}</dd>
              </>
            )}
            <dt>Host Addresses</dt>
            <dd>
              <DetailPropertyList>
                <DetailPropertyListItem title="Management">
                  {getHostBMCAddress(host)}
                </DetailPropertyListItem>
                <DetailPropertyListItem title="NICs">{ips}</DetailPropertyListItem>
                <DetailPropertyListItem title="Boot Interface MAC">
                  {getHostBootMACAddress(host)}
                </DetailPropertyListItem>
              </DetailPropertyList>
            </dd>
            {machineName && (
              <>
                <dt>Machine</dt>
                <dd>
                  <MachineLink host={host} />
                </dd>
              </>
            )}
            {nodeName && (
              <>
                <dt>Node</dt>
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
            <dt>Created at</dt>
            <dd>
              <Timestamp timestamp={creationTimestamp} />
            </dd>
          </dl>
        </div>
        <div className="col-xs-12 col-sm-6">
          <dl>
            <dt>Status</dt>
            <dd>
              <BareMetalHostStatus {...status} />
            </dd>
            {/* power status is not available until host registration/inspection is finished */}
            {!HOST_REGISTERING_STATES.includes(provisioningState) && (
              <>
                <dt>Power Status</dt>
                <dd>
                  <StatusIconAndText
                    title={powerStatus}
                    icon={<BareMetalHostPowerStatusIcon powerStatus={powerStatus} />}
                  />
                  {isHostScheduledForRestart(host) && (
                    <StatusIconAndText
                      title={HOST_SCHEDULED_FOR_RESTART}
                      icon={<RebootingIcon />}
                    />
                  )}
                </dd>
              </>
            )}
            {role && (
              <>
                <dt>Role</dt>
                <dd>{role}</dd>
              </>
            )}
            {(manufacturer || productName) && (
              <>
                <dt>Model</dt>
                <dd>{_.filter([manufacturer, productName]).join(', ')}</dd>
              </>
            )}
            {bios && (
              <>
                <dt>Bios</dt>
                <dd>
                  <DetailPropertyList>
                    <DetailPropertyListItem title="Version">{bios.version}</DetailPropertyListItem>
                    <DetailPropertyListItem title="Vendor">{bios.vendor}</DetailPropertyListItem>
                    <DetailPropertyListItem title="Date">{bios.date}</DetailPropertyListItem>
                  </DetailPropertyList>
                </dd>
              </>
            )}
            {serialNumber && (
              <>
                <dt>Serial Number</dt>
                <dd>{serialNumber}</dd>
              </>
            )}
            {_.get(host, 'status.hardware') && (
              <>
                <dt>Hardware</dt>
                <dd>
                  <DetailPropertyList>
                    <DetailPropertyListItem title="CPU">
                      {CPUCount}x {CPUModel}
                    </DetailPropertyListItem>
                    <DetailPropertyListItem title="RAM">{RAMGB}</DetailPropertyListItem>
                    <DetailPropertyListItem title="Storage">
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
