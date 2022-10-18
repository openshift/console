import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { HELM_CHART_CATALOG_TYPE_ID } from '@console/helm-plugin/src/const';
import {
  useGetAllDisabledSubCatalogs,
  isCatalogTypeEnabled,
  useIsDeveloperCatalogEnabled,
} from '@console/shared';
import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { mockExtensions } from './catalogTypeExtensions.data';

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;
useResolvedExtensionsMock.mockReturnValue([mockExtensions, true]);

beforeEach(() => {
  delete window.SERVER_FLAGS.developerCatalogTypes;
});

describe('isSubCatalogTypeEnabled - get sub-catalog status', () => {
  it('should show HelmChart catalog type as enabled when dev catalog types are not configured', () => {
    const isEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    expect(isEnabled).toBe(true);
  });
  it('should show HelmChart catalog type as enabled when enabled list is empty', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": [] }';
    const isEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    expect(isEnabled).toBe(true);
  });
  it('should show HelmChart catalog type as disabled when disabled list is empty', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" , "disabled": [] }';
    const isEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    expect(isEnabled).toBe(false);
  });
  it('should show HelmChart catalog type as enabled when HelmChart is added in enabled list', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": ["HelmChart"] }';
    const isEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    expect(isEnabled).toBe(true);
  });
  it('should show HelmChart catalog type as disabled when HelmChart is added in disabled list', () => {
    window.SERVER_FLAGS.developerCatalogTypes =
      '{"state" : "Disabled" , "disabled": ["HelmChart"] }';
    const isEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    expect(isEnabled).toBe(false);
  });
  it('should show HelmChart catalog type as disabled when HelmChart is not added in enabled list', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": ["Devfile"] }';
    const isEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    expect(isEnabled).toBe(false);
  });
  it('should show HelmChart catalog type as enabled when HelmChart is not added in disabled list', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" , "disabled": ["Devfile"] }';
    const isEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    expect(isEnabled).toBe(true);
  });
  it('should show HelmChart catalog type as enabled when HelmChart is added in enabled list along with other sub-catalog', () => {
    window.SERVER_FLAGS.developerCatalogTypes =
      '{"state" : "Enabled" , "enabled": ["Devfile","HelmChart"] }';
    const isEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    expect(isEnabled).toBe(true);
  });
  it('should show HelmChart catalog type as enabled when enabled attribute is not added', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" }';
    const isEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    expect(isEnabled).toBe(true);
  });
  it('should show HelmChart catalog type as disabled when disabled attribute is not added', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" }';
    const isEnabled = isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID);
    expect(isEnabled).toBe(false);
  });
});

describe('useIsDeveloperCatalogEnabled - check if developer catalog is enabled or not', () => {
  it('should show developer catalog as enabled when enabled list is empty', () => {
    testHook(() => {
      window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": [] }';
      const isEnabled = useIsDeveloperCatalogEnabled();
      expect(isEnabled).toBe(true);
    });
  });
  it('should show developer catalog as disabled when disabled list is empty', () => {
    testHook(() => {
      window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" , "disabled": [] }';
      const isEnabled = useIsDeveloperCatalogEnabled();
      expect(isEnabled).toBe(false);
    });
  });
  it('should show developer catalog as enabled when enabled list is not empty', () => {
    testHook(() => {
      window.SERVER_FLAGS.developerCatalogTypes =
        '{"state" : "Enabled" , "enabled": ["HelmChart"] }';
      const isEnabled = useIsDeveloperCatalogEnabled();
      expect(isEnabled).toBe(true);
    });
  });
  it('should show developer catalog as disabled when all sub-catalogs are disabled', () => {
    testHook(() => {
      window.SERVER_FLAGS.developerCatalogTypes =
        '{"state" : "Disabled" , "disabled": ["HelmChart","Devfile","EventSource","EventSink","OperatorBackedService","Sample","Template","BuilderImage"]}';
      const isEnabled = useIsDeveloperCatalogEnabled();
      expect(isEnabled).toBe(false);
    });
  });
  it('should show developer catalog as enabled when enabled attribute is not added', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" }';
    const isEnabled = useIsDeveloperCatalogEnabled();
    expect(isEnabled).toBe(true);
  });
  it('should show developer catalog as enabled when enabled attribute is not added', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" }';
    const isEnabled = useIsDeveloperCatalogEnabled();
    expect(isEnabled).toBe(false);
  });
});

describe('useGetAllDisabledSubCatalogs - get all the disabled sub-catalogs', () => {
  it('should return no sub-catalog is disabled when dev catalog types are not configured', () => {
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(0);
    });
  });
  it('should return no sub-catalog is disabled when HelmChart is added in disabled list', () => {
    window.SERVER_FLAGS.developerCatalogTypes =
      '{"state" : "Disabled" , "disabled": ["HelmChart"] }';
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(1);
    });
  });
  it('should return all sub-catalogs are disabled when disabled list is empty', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Disabled" , "disabled": [] }';
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(8);
    });
  });
  it('should return no sub-catalogs are disabled when enabled list is empty', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": [] }';
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(0);
    });
  });
  it('should return five sub-catalogs are disabled when enabled list is having three sub-catalogs', () => {
    window.SERVER_FLAGS.developerCatalogTypes =
      '{"state" : "Enabled" , "enabled": ["Devfile","HelmChart","Sample"] }';
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(5);
    });
  });
  it('should return seven sub-catalogs are disabled when enabled list is having one sub-catalog', () => {
    window.SERVER_FLAGS.developerCatalogTypes = '{"state" : "Enabled" , "enabled": ["Devfile"] }';
    testHook(() => {
      const [disabledSubCatalogs] = useGetAllDisabledSubCatalogs();
      expect(disabledSubCatalogs.length).toBe(7);
    });
  });
});
