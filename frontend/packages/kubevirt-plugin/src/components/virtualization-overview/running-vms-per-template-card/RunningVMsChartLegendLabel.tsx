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
  const iconStyle = { color: item?.color };
  const linkPath = item?.namespace
    ? `/k8s/ns/${item.namespace}/virtualmachinetemplates/${item?.name}`
    : null;

  return (
    <>
      <i className="fas fa-square kv-running-vms-card__legend-label--color" style={iconStyle} />
      <span className="kv-running-vms-card__legend-label--count">{item?.vmCount}</span>{' '}
      {linkPath ? <Link to={linkPath}>{item?.name}</Link> : <span>{item?.name}</span>}
    </>
  );
};
