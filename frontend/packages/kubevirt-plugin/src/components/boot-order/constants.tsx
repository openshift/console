export const bootOrderEmptyTitle = 'No resource selected';
export const bootOrderEmptyMessage =
  'VM will attempt to boot from disks by order of apearance in YAML file';

export const deviceKey = (device) => `${device.type}-${device.value.name}`;
export const deviceLabel = (device) => `${device.value.name} (${device.typeLabel})`;
