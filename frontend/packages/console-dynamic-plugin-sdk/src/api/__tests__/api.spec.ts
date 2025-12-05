import * as coreApi from '../core-api';
import * as internalApi from '../internal-api';

describe('@openshift-console/dynamic-plugin-sdk/lib/api/core-api', () => {
  Object.entries(coreApi).forEach(([exportName, exportValue]) => {
    it(`should export ${exportName}`, () => {
      expect(exportValue).toBeDefined();
    });
  });
});

describe('@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-api', () => {
  Object.entries(internalApi).forEach(([exportName, exportValue]) => {
    it(`should export ${exportName}`, () => {
      expect(exportValue).toBeDefined();
    });
  });
});
