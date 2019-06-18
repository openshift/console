import * as React from 'react';
import * as _ from 'lodash';

import { ContainerSpec } from '../../module/k8s';

const ContainerRow: React.SFC<ContainerRowProps> = ({container}) => {
  const resourceLimits = _.get(container, 'resources.limits');
  const ports = _.get(container, 'ports');
  return <div className="row">
    <div className="col-xs-5 col-sm-4 col-md-3 co-break-word">
      {container.name}
    </div>
    <div className="col-xs-7 col-sm-5 co-break-all co-select-to-copy">{container.image || '-'}</div>
    <div className="col-sm-3 col-md-2 hidden-xs">{_.map(resourceLimits, (v, k) => `${k}: ${v}`).join(', ') || '-'}</div>
    <div className="col-md-2 hidden-xs hidden-sm co-break-word">{_.map(ports, port => `${port.containerPort}/${port.protocol}`).join(', ') || '-'}</div>
  </div>;
};

export const ContainerTable: React.SFC<ContainerTableProps> = ({containers}) => <div className="co-m-table-grid co-m-table-grid--bordered">
  <div className="row co-m-table-grid__head">
    <div className="col-xs-5 col-sm-4 col-md-3">Name</div>
    <div className="col-xs-7 col-sm-5">Image</div>
    <div className="col-sm-3 col-md-2 hidden-xs">Resource Limits</div>
    <div className="col-md-2 hidden-xs hidden-sm">Ports</div>
  </div>
  <div className="co-m-table-grid__body">
    {_.map(containers, (c, i) => <ContainerRow key={i} container={c} />)}
  </div>
</div>;

export type ContainerRowProps = {
  container: ContainerSpec;
};

export type ContainerTableProps = {
  containers: ContainerSpec[];
};
