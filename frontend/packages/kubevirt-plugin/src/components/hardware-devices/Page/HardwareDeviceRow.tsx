import * as React from 'react';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { dimensifyRow } from '../../../utils';

const tableColumnClasses = ['', ''];

const HardwareDeviceRow: React.FC<RowFunctionArgs<any>> = ({ obj: device }) => {
  const dimensify = dimensifyRow(tableColumnClasses);

  return (
    <>
      <TableData className={dimensify()}>{device?.name}</TableData>
      <TableData className={dimensify(true)}>{device?.count}</TableData>
    </>
  );
};

export default HardwareDeviceRow;
