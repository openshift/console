import * as React from 'react';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { dimensifyRow } from '../../../utils';
import { tableColumnClasses } from '../utils';

const HardwareDeviceRow: React.FC<RowFunctionArgs<any>> = ({
  obj: device,
  customData: devicesCount,
}) => {
  const dimensify = dimensifyRow(tableColumnClasses);

  return (
    <>
      <TableData className={dimensify()}>{device}</TableData>
      <TableData className={dimensify(true)}>{devicesCount[device]}</TableData>
    </>
  );
};

export default HardwareDeviceRow;
