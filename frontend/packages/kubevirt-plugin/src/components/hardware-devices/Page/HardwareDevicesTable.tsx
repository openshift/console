import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { dimensifyHeader } from '@console/shared/src/utils';
import FilteredTable from '../../FilteredTable/FilteredTable';
import HardwareDeviceRow from './HardwareDeviceRow';

const tableColumnClasses = ['', ''];

const HardwareDevicesTable: React.FC<any> = ({ obj, deviceSelector, label, ...props }) => {
  const { t } = useTranslation();

  const flattenDevices = React.useMemo(() => {
    const counts = {};

    deviceSelector(obj)?.forEach((device) => {
      counts[device.resourceName] = counts[device.resourceName] + 1 || 1;
    });

    return Object.keys(counts).map((key) => ({ name: key, count: counts[key] }));
  }, [deviceSelector, obj]);

  const header = () =>
    dimensifyHeader(
      [
        {
          title: t('kubevirt-plugin~Resource name'),
        },
        {
          title: t('kubevirt-plugin~Quantity'),
        },
      ],
      tableColumnClasses,
    );

  return (
    <div className="co-m-pane__body">
      <FilteredTable
        {...props}
        Header={header}
        Row={HardwareDeviceRow}
        loaded
        virtualize
        data={flattenDevices}
        label={label}
      />
    </div>
  );
};

export default HardwareDevicesTable;
