/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';

import { Overflow } from './';

const ContainerRow: React.SFC<ContainerRowProps> = ({container}) => {
  const resourceLimits = _.get(container, 'resources.limits');
  const ports = _.get(container, 'ports');
  return <div className="row">
    <div className="col-xs-6 col-sm-4 col-md-3">
      {container.name}
    </div>
    <Overflow className="col-xs-6 col-sm-4 col-md-3" value={container.image} />
    <div className="col-sm-4 col-md-3 hidden-xs">{_.map(resourceLimits, (v, k) => `${k}: ${v}`).join(', ') || '-'}</div>
    <Overflow className="col-md-3 hidden-xs hidden-sm" value={_.map(ports, port => `${port.containerPort}/${port.protocol}`).join(', ')} />
  </div>;
};

export const ContainerTable: React.SFC<ContainerTableProps> = ({containers}) => <div className="co-m-table-grid co-m-table-grid--bordered">
  <div className="row co-m-table-grid__head">
    <div className="col-xs-6 col-sm-4 col-md-3">Name</div>
    <div className="col-xs-6 col-sm-4 col-md-3">Image</div>
    <div className="col-sm-4 col-md-3 hidden-xs">Resource Limits</div>
    <div className="col-md-3 hidden-xs hidden-sm">Ports</div>
  </div>
  <div className="co-m-table-grid__body">
    {_.map(containers, (c, i) => <ContainerRow key={i} container={c} />)}
  </div>
</div>;

export type ContainerRowProps = {
  container: any,
};

export type ContainerTableProps = {
  containers: any[],
};
