import { ModelMetadata } from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/plugin-sdk';
import { pluralizeKind, getModelExtensionMetadata } from '../../../public/module/k8s/get-resources';

describe('pluralizeKind', () => {
  const testPluralizeKind = (kind: string, expected: string) => {
    it(`${kind} into ${expected}`, () => {
      expect(pluralizeKind(kind)).toEqual(expected);
    });
  };

  testPluralizeKind('DB', 'DBs');
  testPluralizeKind('DNS', 'DNS');
  testPluralizeKind('DNSRecord', 'DNSRecords');
  testPluralizeKind('DeploymentConfig', 'DeploymentConfigs');
  testPluralizeKind('Endpoints', 'Endpoints');
  testPluralizeKind('Identity', 'Identities');
  testPluralizeKind('ImageContentSourcePolicy', 'ImageContentSourcePolicies');
  testPluralizeKind('Ingress', 'Ingresses');
  testPluralizeKind('OAuth', 'OAuths');
  testPluralizeKind('OAuthAccessToken', 'OAuthAccessTokens');
  testPluralizeKind('PodMetrics', 'PodMetrics');
  testPluralizeKind('Prometheus', 'Prometheuses');
  testPluralizeKind('Proxy', 'Proxies');
});

describe('getModelExtensionMetadata', () => {
  it('ModelMetadata extensions array to merged metadata object', () => {
    const model = {
      group: 'group1',
      kind: 'mock',
      version: 'v1',
    };

    const mockGroup = {
      properties: {
        model: {
          group: model.group,
        },
        color: 'red',
      },
    };

    const mockGroupKind = {
      properties: {
        model: {
          group: model.group,
          kind: model.kind,
        },
        color: 'blue',
        abbr: 'KS',
      },
    };
    const mockGroupKindVersion = {
      properties: {
        model,
        abbr: 'CFG',
      },
    };

    expect(
      getModelExtensionMetadata(
        [mockGroup, mockGroupKind, mockGroupKindVersion] as LoadedExtension<ModelMetadata>[],
        model.group,
        model.version,
        model.kind,
      ),
    ).toEqual({
      color: 'blue',
      abbr: 'CFG',
    });
  });
});
