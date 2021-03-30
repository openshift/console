export const eventListener = (eventType: string, properties: {}) => {
  // eslint-disable-next-line no-console
  console.log('Demo Plugin received telemetry event: ', eventType, properties);
};
