import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import {
  useGetAllDisabledSubCatalogs,
  isCatalogTypeEnabled,
  useIsDeveloperCatalogEnabled,
} from '../useAddActionExtensions';
import { mockExtensions } from './catalogTypeExtensions.data';
import { testHook } from './utils/hooks-utils';

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;
useResolvedExtensionsMock.mockReturnValue([mockExtensions, true]);

beforeEach(() => {
  delete window.SERVER_FLAGS.developerCatalogTypes;
});

describe('isSubCatalogTypeEnabled - get sub-catalog status', () => {
  it('if customization is not there', () => {
    const isEnabled = isCatalogTypeEnabled('HelmChart');
    expect(isEnabled).toBe(true);
  });
  it('if none of the sub-catalogs enabled', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": [] }';
    const isEnabled = isCatalogTypeEnabled('HelmChart');
    expect(isEnabled).toBe(true);
  });
  it('if disabled list is empty', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" , "disabled": [] }';
    const isEnabled = isCatalogTypeEnabled('HelmChart');
    expect(isEnabled).toBe(false);
  });
  it('if sub-catalog is enabled', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": ["HelmChart"] }';
    const isEnabled = isCatalogTypeEnabled('HelmChart');
    expect(isEnabled).toBe(true);
  });
  it('if sub-catalog is disabled', () => {
    window.SERVER_FLAGS.developerCatalogTypes =
      '{"state" : "Disabled" , "disabled": ["HelmChart"] }';
    const isEnabled = isCatalogTypeEnabled('HelmChart');
    expect(isEnabled).toBe(false);
  });
  it('if sub-catalog is not added in enabled list', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": ["Devfile"] }';
    const isEnabled = isCatalogTypeEnabled('HelmChart');
    expect(isEnabled).toBe(false);
  });
  it('if sub-catalog is not added in disabled list', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" , "disabled": ["Devfile"] }';
    const isEnabled = isCatalogTypeEnabled('HelmChart');
    expect(isEnabled).toBe(true);
  });
  it('if sub-catalog enabled along with other types', () => {
    window.SERVER_FLAGS.developerCatalogTypes =
      '{"state" : "Enabled" , "enabled": ["Devfile","HelmChart"] }';
    const isEnabled = isCatalogTypeEnabled('HelmChart');
    expect(isEnabled).toBe(true);
  });
  it('if state is Enabled but enabled list is not added', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" }';
    const isEnabled = isCatalogTypeEnabled('HelmChart');
    expect(isEnabled).toBe(true);
  });
  it('if state is Disabled but disabled list is not added', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" }';
    const isEnabled = isCatalogTypeEnabled('HelmChart');
    expect(isEnabled).toBe(false);
  });
});

describe('useIsDeveloperCatalogEnabled - check if developer catalog is enabled or not', () => {
  it('if enabled list is empty', () => {
    testHook(() => {
      window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": [] }';
      const isEnabled = useIsDeveloperCatalogEnabled();
      expect(isEnabled).toBe(true);
    });
  });
  it('if disabled list is empty', () => {
    testHook(() => {
      window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" , "disabled": [] }';
      const isEnabled = useIsDeveloperCatalogEnabled();
      expect(isEnabled).toBe(false);
    });
  });
  it('atleast one sub-catalog is enabled', () => {
    testHook(() => {
      window.SERVER_FLAGS.developerCatalogTypes =
        '{"state" : "Enabled" , "enabled": ["HelmChart"] }';
      const isEnabled = useIsDeveloperCatalogEnabled();
      expect(isEnabled).toBe(true);
    });
  });
  it('all the sub-catalogs are disabled', () => {
    testHook(() => {
      window.SERVER_FLAGS.developerCatalogTypes =
        '{"state" : "Disabled" , "disabled": ["HelmChart","Devfile","EventSource","EventSink","OperatorBackedService","Sample","Template","BuilderImage"]}';
      const isEnabled = useIsDeveloperCatalogEnabled();
      expect(isEnabled).toBe(false);
    });
  });
  it('if state is Enabled but enabled list is not added', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" }';
    const isEnabled = useIsDeveloperCatalogEnabled();
    expect(isEnabled).toBe(true);
  });
  it('if state is Disabled but disabled list is not added', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" }';
    const isEnabled = useIsDeveloperCatalogEnabled();
    expect(isEnabled).toBe(false);
  });
});

describe('useGetAllDisabledSubCatalogs - get all the disabled sub-catalogs', () => {
  it('if customization is not added', () => {
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(0);
    });
  });
  it('if one sub-catalog is disabled', () => {
    window.SERVER_FLAGS.developerCatalogTypes =
      '{"state" : "Disabled" , "disabled": ["HelmChart"] }';
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(1);
    });
  });
  it('if all sub-catalogs are disabled', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" , "disabled": [] }';
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(8);
    });
  });
  it('if enabled list is empty', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": [] }';
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(0);
    });
  });
  it('if 3 sub-catalogs are enabled', () => {
    window.SERVER_FLAGS.developerCatalogTypes =
      '{"state" : "Enabled" , "enabled": ["Devfile","HelmChart","Sample"] }';
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(5);
    });
  });
  it('if one sub-catalog is enabled', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": ["Devfile"] }';
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(7);
    });
  });
});
