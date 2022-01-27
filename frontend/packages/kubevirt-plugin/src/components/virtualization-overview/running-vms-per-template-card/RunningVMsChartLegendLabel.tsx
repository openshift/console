import * as React from 'react';
import { Link } from 'react-router-dom';

import './running-vms-per-template-card.scss';

export type RunningVMsChartLegendLabelItem = {
  name: string;
  vmCount: number;
  color: string;
  namespace: string;
};

type RunningVMsChartLegendLabelProps = {
  item: RunningVMsChartLegendLabelItem;
};

export const RunningVMsChartLegendLabel: React.FC<RunningVMsChartLegendLabelProps> = ({ item }) => {
  const iconStyle = { color: item.color };
  // const linkPath = `/k8s/ns/${item.namespace}/kubevirt.io~v1~VirtualMachine?labels=vm.kubevirt.io/template=${item.name}`
  const linkPath = `/k8s/ns/${item.namespace}/virtualmachinetemplates/${item.name}`;

  return (
    <>
      <i className="fas fa-square kv-running-vms-card__legend-label--color" style={iconStyle} />
      <span className="kv-running-vms-card__legend-label--count">{item.vmCount}</span>{' '}
      <Link to={linkPath}>{item.name}</Link>
    </>
  );
};
