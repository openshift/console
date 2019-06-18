import * as React from 'react';
import * as classNames from 'classnames';

import { Row, Col } from 'patternfly-react';

import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory, SectionHeading, Timestamp } from '@console/internal/components/utils';
import { units } from '@console/internal/components/utils/units';
import { getName } from '@console/shared';

import { BaremetalHostModel } from '../models';
import MachineCell from './machine-cell';
import {
  getHostNICs,
  isHostOnline,
  getHostDescription,
  getHostBMCAddress,
  getHostCPU,
  getHostRAM,
  getHostTotalStorageCapacity,
} from '../selectors';

type BaremetalHostDetailPageProps = {
  namespace: string;
  name: string;
  match: any;
};

const BaremetalHostDetails: React.FC<{ obj: K8sResourceKind }> = ({ obj }) => {
  const { creationTimestamp } = obj.metadata;
  const nics = getHostNICs(obj);
  const online = isHostOnline(obj);
  const ips = nics.map((nic) => nic.ip).join(', ');

  const statusIconClasses = classNames('fa fa-refresh', { 'co-icon-and-text__icon': online });

  const totalCapacity = units.humanize(
    // The value from the selector is in GB
    getHostTotalStorageCapacity(obj) * 1024 ** 3,
    'decimalBytes',
    true,
  ).string;

  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Baremetal Host Overview" />
      <Row>
        <Col sm={6} xs={12} id="name-description-column">
          <dl>
            <dt>Name</dt>
            <dd>{getName(obj)}</dd>
            <dt>Description</dt>
            <dd>{getHostDescription(obj)}</dd>
            <dt>Host Addresses</dt>
            <dd>
              Management: {getHostBMCAddress(obj)}
              <br />
              NICs: {ips}
            </dd>
            <dt>Machine</dt>
            <dd>
              <MachineCell host={obj} />
            </dd>
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
              <span className="co-icon-and-text">
                <span aria-hidden="true" className={statusIconClasses} />
                {online ? 'Running' : 'Not running'}
              </span>
            </dd>
            <dt>Hardware</dt>
            <dd>
              {getHostCPU(obj).count} CPU cores
              <br />
              {getHostRAM(obj)} GB RAM
              <br />
              {totalCapacity} Disk
            </dd>
          </dl>
        </Col>
      </Row>
    </div>
  );
};

export const BaremetalHostDetailPage: React.FC<BaremetalHostDetailPageProps> = (props) => (
  <DetailsPage
    {...props}
    pagesFor={() => [navFactory.details(BaremetalHostDetails), navFactory.editYaml()]}
    kind={referenceForModel(BaremetalHostModel)}
  />
);
