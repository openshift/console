import * as React from 'react';
import * as _ from 'lodash';

import { Row, Col } from 'patternfly-react';

import {
  referenceForModel,
  K8sResourceKind,
  MachineKind,
  NodeKind,
} from '@console/internal/module/k8s';
import { DetailsPage } from '@console/internal/components/factory';
import {
  navFactory,
  SectionHeading,
  Timestamp,
  humanizeDecimalBytes,
  StatusIconAndText,
  ResourceLink,
} from '@console/internal/components/utils';
import { MachineModel, NodeModel } from '@console/internal/models';
import {
  getName,
  getMachineNode,
  getMachineNodeName,
  getNamespace,
  getMachineRole,
} from '@console/shared';

import { ResourceEventStream } from '@console/internal/components/events';
import { BaremetalHostModel } from '../models';
import { canHostAddMachine } from '../utils/host-status';
import MachineCell from './machine-cell';
import {
  getHostNICs,
  getHostDescription,
  getHostBMCAddress,
  getHostCPU,
  getHostRAMMiB,
  getHostTotalStorageCapacity,
  getHostMachineName,
  isHostPoweredOn,
  getHostVendorInfo,
  getHostMachine,
} from '../selectors';
import BaremetalHostStatus from './host-status';
import BaremetalHostNICList from './host-nics';
import BaremetalHostDiskList from './host-disks';
import { HostDashboard } from './dashboard';

type BaremetalHostDetailPageProps = {
  namespace: string;
  name: string;
  match: any;
};

type BaremetalHostDetailsProps = {
  obj: K8sResourceKind;
  machines: MachineKind[];
  nodes: NodeKind[];
};

const BaremetalHostDetails: React.FC<BaremetalHostDetailsProps> = ({
  obj: host,
  machines,
  nodes,
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
  const hostPoweredOn = isHostPoweredOn(host) ? 'Powered On' : 'Powered Off';
  const { count: CPUCount, model: CPUModel } = getHostCPU(host);
  const { manufacturer, productName, serialNumber } = getHostVendorInfo(host);

  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Baremetal Host Overview" />
      <Row>
        <Col sm={6} xs={12} id="name-description-column">
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
              Management: {getHostBMCAddress(host)}
              <br />
              NICs: {ips}
            </dd>
            {(canHostAddMachine(host) || machineName) && (
              <>
                <dt>Machine</dt>
                <dd>
                  <MachineCell host={host} />
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
        </Col>
        <Col sm={6} xs={12}>
          <dl>
            <dt>Status</dt>
            <dd>
              <BaremetalHostStatus host={host} machine={machine} node={node} />
            </dd>
            <dt>Power Status</dt>
            <dd>
              <StatusIconAndText
                status={hostPoweredOn ? 'Running' : 'Powered Off'}
                iconName={hostPoweredOn ? 'on-running' : 'off'}
              />
            </dd>
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
                  {CPUCount}x {CPUModel} CPU
                  <br />
                  {RAMGB} RAM
                  <br />
                  {totalStorageCapacity} Disk
                </dd>
              </>
            )}
          </dl>
        </Col>
      </Row>
    </div>
  );
};

export const BaremetalHostDetailPage: React.FC<BaremetalHostDetailPageProps> = (props) => {
  const machinesResource = {
    kind: referenceForModel(MachineModel),
    namespaced: true,
    isList: true,
    prop: 'machines',
  };
  const nodesResource = {
    kind: NodeModel.kind,
    namespaced: false,
    isList: true,
    prop: 'nodes',
  };
  const nicsPage = {
    href: 'nics',
    name: 'Network Interfaces',
    component: BaremetalHostNICList,
  };
  const disksPage = {
    href: 'disks',
    name: 'Disks',
    component: BaremetalHostDiskList,
  };
  const dashboardPage = {
    href: 'dashboard',
    name: 'Dashboard',
    component: HostDashboard,
  };
  return (
    <DetailsPage
      {...props}
      pagesFor={() => [
        navFactory.details(BaremetalHostDetails),
        dashboardPage,
        navFactory.editYaml(),
        nicsPage,
        disksPage,
        navFactory.events(ResourceEventStream),
      ]}
      kind={referenceForModel(BaremetalHostModel)}
      resources={[machinesResource, nodesResource]}
    />
  );
};
