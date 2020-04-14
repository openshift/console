import { pluralizeKind } from '../../../public/module/k8s/get-resources';

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
