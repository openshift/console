import { kindToLabel, pluralizeKind } from '../../../public/module/k8s/get-resources';

describe('kindToLabel', () => {
  const testKindToLabel = (kind: string, expected: string) => {
    it(`${kind} into ${expected}`, () => {
      expect(kindToLabel(kind)).toEqual(expected);
    });
  };

  testKindToLabel('APIcast', 'APIcast');
  testKindToLabel('DNS', 'DNS');
  testKindToLabel('DNSRecord', 'DNS Record');
  testKindToLabel('DeploymentConfig', 'Deployment Config');
  testKindToLabel('OAuth', 'OAuth');
  testKindToLabel('OAuthAccessToken', 'OAuth Access Token');
});

describe('pluralizeKind', () => {
  const testPluralizeKind = (kind: string, expected: string) => {
    it(`${kind} into ${expected}`, () => {
      expect(pluralizeKind(kind)).toEqual(expected);
    });
  };

  testPluralizeKind('DB', 'DBs');
  testPluralizeKind('DNS', 'DNS');
  testPluralizeKind('DNSRecord', 'DNS Records');
  testPluralizeKind('DeploymentConfig', 'Deployment Configs');
  testPluralizeKind('Endpoints', 'Endpoints');
  testPluralizeKind('Identity', 'Identities');
  testPluralizeKind('ImageContentSourcePolicy', 'Image Content Source Policies');
  testPluralizeKind('Ingress', 'Ingresses');
  testPluralizeKind('OAuth', 'OAuths');
  testPluralizeKind('OAuthAccessToken', 'OAuth Access Tokens');
  testPluralizeKind('PodMetrics', 'Pod Metrics');
  testPluralizeKind('Prometheus', 'Prometheuses');
  testPluralizeKind('Proxy', 'Proxies');
});
