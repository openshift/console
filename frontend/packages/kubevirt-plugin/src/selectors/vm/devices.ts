export const getBootDeviceIndex = (devices, bootOrder) =>
  devices.findIndex((device) => device.bootOrder === bootOrder);
