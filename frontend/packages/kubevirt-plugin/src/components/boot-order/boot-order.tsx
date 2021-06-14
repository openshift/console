import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { BootableDeviceType } from '../../types';
import { DNDDataList, DNDDataListItem } from '../dnd-list';
import { AddDevice } from './add-device';
import { BootOrderEmpty } from './boot-order-empty';
import { deviceKey, deviceLabel } from './constants';

import './boot-order.scss';

export const BootOrder = ({ devices, setDevices }: BootOrderProps) => {
  const { t } = useTranslation();
  const sources = _.sortBy(
    devices.filter((device) => device.value.bootOrder),
    'value.bootOrder',
  );
  const options = devices.filter((device) => !device.value.bootOrder);
  const [isEditMode, setEditMode] = React.useState<boolean>(false);

  // Relax bootOrder and use setDevice to update the parent componenet.
  const updateDevices = (newDevices: BootableDeviceType[]): void => {
    _.filter(newDevices, (device) => device.value.bootOrder).forEach((source, i) => {
      source.value.bootOrder = i + 1;
    });

    setDevices(newDevices);
    setEditMode(false);
  };

  // Remove a bootOrder from a device by index.
  const onDelete = (index: number) => {
    const newDevices = _.cloneDeep(devices);

    const key = deviceKey(sources[index]);
    delete newDevices.find((device) => deviceKey(device) === key).value.bootOrder;

    updateDevices(newDevices);
  };

  // Move a source from one index to another.
  const onMove = (index: number, toIndex: number) => {
    const unMovedSources = [...sources.slice(0, index), ...sources.slice(index + 1)];

    // Create an ordered copy of the sources.
    const newSources = _.cloneDeep([
      ...unMovedSources.slice(0, toIndex),
      sources[index],
      ...unMovedSources.slice(toIndex),
    ]);

    updateDevices([...newSources, ...options]);
  };

  // Add a bootOrder to a device by key, item key is "<type>->name>".
  const onAdd = (key: string): void => {
    const newOptions = _.cloneDeep(options);
    newOptions.find((option) => deviceKey(option) === key).value.bootOrder = sources.length + 1;

    updateDevices([...sources, ...newOptions]);
  };

  const showEmpty = sources.length === 0 && !isEditMode;
  const dataListID = 'VMBootOrderList';

  return (
    <>
      {showEmpty ? (
        <BootOrderEmpty
          title={t('kubevirt-plugin~No resource selected')}
          message={t(
            'kubevirt-plugin~VM will attempt to boot from disks by order of apearance in YAML file',
          )}
          addItemMessage={t('kubevirt-plugin~Add source')}
          addItemDisabledMessage={t('kubevirt-plugin~All sources selected')}
          addItemIsDisabled={options.length === 0}
          onClick={() => {
            setEditMode(true);
          }}
        />
      ) : (
        <>
          <DNDDataList id={dataListID} aria-label={t('kubevirt-plugin~VM Boot Order List')}>
            {sources.map((source, index) => (
              <DNDDataListItem
                index={index}
                onDelete={onDelete}
                onMove={onMove}
                aria-labelledby={`device-${deviceKey(source)}`}
                key={`device-${deviceKey(source)}`}
                className="kubevirt-boot-order__data-list-item"
              >
                <Text id={`device-${deviceKey(source)}`} component={TextVariants.p}>
                  {deviceLabel(source)}
                </Text>
              </DNDDataListItem>
            ))}
          </DNDDataList>
          <AddDevice
            devices={devices}
            onAdd={onAdd}
            isEditMode={isEditMode}
            setEditMode={setEditMode}
          />
        </>
      )}
    </>
  );
};

export type BootOrderProps = {
  devices: BootableDeviceType[];
  setDevices: (devices: BootableDeviceType[]) => void;
};
