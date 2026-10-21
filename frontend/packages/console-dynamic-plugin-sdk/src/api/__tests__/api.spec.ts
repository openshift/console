import * as coreApi from '../core-api';
import * as internalApi from '../internal-api';

describe('@openshift-console/dynamic-plugin-sdk/lib/api/core-api', () => {
  it.each(Object.entries(coreApi))('should export %s', (_name, exportValue) => {
    expect(exportValue).toBeDefined();
  });
});

describe('@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-api', () => {
  it.each(Object.entries(internalApi))('should export %s', (_name, exportValue) => {
    expect(exportValue).toBeDefined();
  });
});
