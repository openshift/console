import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TextFilter } from '@console/internal/components/factory';
import { useHyperconvergedCR } from '../../../hooks/use-hyperconverged-resource';
import { deviceCounts, HWDHeader } from '../utils';
import HardwareDeviceRow from './HardwareDeviceRow';

const HardwareDevicesTable: React.FC<any> = (props) => {
  const { t } = useTranslation();

  const [hc, loaded] = useHyperconvergedCR();
  const devices: any[] = props.isPCI
    ? hc?.spec?.permittedHostDevices?.pciHostDevices
    : hc?.spec?.permittedHostDevices?.mediatedDevices;
  const devicesCount = deviceCounts(devices);
  const flattenDevices = Object.keys(devicesCount);

  const [textFilter, setTextFilter] = React.useState<string>('');
  const hasFilter = textFilter?.length > 0;
  const [filteredDevices, setFilteredDevices] = React.useState<any[]>(flattenDevices);

  React.useEffect(() => {
    if (hasFilter) {
      const filtered = flattenDevices?.filter((dev) => {
        return dev.toLowerCase().includes(textFilter.toLowerCase());
      });
      setFilteredDevices(filtered);
    } else {
      setFilteredDevices(flattenDevices);
    }
  }, [flattenDevices, hasFilter, hc, textFilter]);

  return (
    <div className="co-m-pane__body">
      <div className="co-m-pane__filter-row">
        <TextFilter value={textFilter} onChange={setTextFilter} />
      </div>
      <Table
        {...props}
        Header={HWDHeader(t)}
        Row={HardwareDeviceRow}
        loaded={loaded}
        virtualize
        data={filteredDevices}
        customData={devicesCount}
        label={
          props.isPCI
            ? t('kubevirt-plugin~PCI host devices')
            : t('kubevirt-plugin~mediated devices')
        }
      />
    </div>
  );
};

export default HardwareDevicesTable;
