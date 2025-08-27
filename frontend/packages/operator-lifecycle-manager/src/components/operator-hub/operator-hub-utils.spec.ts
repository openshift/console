import {
  AuthenticationKind,
  CloudCredentialKind,
  InfrastructureKind,
} from '@console/internal/module/k8s';
import { PackageManifestKind } from '../../types';
import {
  defaultPackageSourceMap,
  getPackageSource,
  isAWSSTSCluster,
  isAzureWIFCluster,
  isGCPWIFCluster,
  isArrayOfStrings,
  getClusterServiceVersionPlugins,
  isK8sResource,
  getInternalObjects,
  getSuggestedNamespaceTemplate,
  getInitializationResource,
  getValidSubscription,
  getInfrastructureFeatures,
  operatorHubItemToCatalogItem,
} from './operator-hub-utils';
import { InfrastructureFeature, OLMAnnotation, OperatorHubItem, ValidSubscriptionValue } from '.';

describe('getPackageSource', () => {
  it('should handle undefined argument', () => {
    const source = getPackageSource(undefined);
    expect(source).toBeUndefined();
  });
  it('should return correct default Red Hat operator sources', () => {
    Object.entries(defaultPackageSourceMap).forEach(([key, value]) => {
      const pm = {
        status: { catalogSource: key },
      } as PackageManifestKind;
      expect(getPackageSource(pm)).toEqual(value);
    });
  });
  it('should fall back to PackageManifest.status.catalogSourceDisplayName first', () => {
    const pm = {
      status: {
        catalogSource: 'foo',
        catalogSourceDisplayName: 'Foo Source',
      },
    } as PackageManifestKind;
    const source = getPackageSource(pm);
    expect(source).toEqual('Foo Source');
  });
  it('should fall back to PackageManifest.status.catalogSource second', () => {
    const pm = { status: { catalogSource: 'foo' } } as PackageManifestKind;
    const source = getPackageSource(pm);
    expect(source).toEqual('foo');
  });
});

describe('isAWSSTSCluster', () => {
  it('should handle undefined arguments', () => {
    const result = isAWSSTSCluster(undefined, undefined, undefined);
    expect(result).toEqual(false);
  });
  it('should return true', () => {
    const cloudcreds = { spec: { credentialsMode: 'Manual' } } as CloudCredentialKind;
    const infra = { status: { platform: 'AWS' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: 'foo' } } as AuthenticationKind;
    const result = isAWSSTSCluster(cloudcreds, infra, auth);
    expect(result).toEqual(true);
  });
  it('should return false if cloud credential mode is not Manual', () => {
    const cloudcreds = { spec: { credentialsMode: 'Automatic' } } as CloudCredentialKind;
    const infra = { status: { platform: 'AWS' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: '' } } as AuthenticationKind;
    const result = isAWSSTSCluster(cloudcreds, infra, auth);
    expect(result).toEqual(false);
  });
  it('should return false if infrastructure platform is not AWS', () => {
    const cloudcreds = { spec: { credentialsMode: 'Manual' } } as CloudCredentialKind;
    const infra = { status: { platform: 'GCP' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: '' } } as AuthenticationKind;
    const result = isAWSSTSCluster(cloudcreds, infra, auth);
    expect(result).toEqual(false);
  });
  it('should return false if auth service account issuer is empty', () => {
    const cloudcreds = { spec: { credentialsMode: 'Manual' } } as CloudCredentialKind;
    const infra = { status: { platform: 'AWS' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: '' } } as AuthenticationKind;
    const result = isAWSSTSCluster(cloudcreds, infra, auth);
    expect(result).toEqual(false);
  });
});

describe('isAzureWIFCluster', () => {
  it('should handle undefined arguments', () => {
    const result = isAzureWIFCluster(undefined, undefined, undefined);
    expect(result).toEqual(false);
  });
  it('should return true', () => {
    const cloudcreds = { spec: { credentialsMode: 'Manual' } } as CloudCredentialKind;
    const infra = { status: { platform: 'Azure' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: 'foo' } } as AuthenticationKind;
    const result = isAzureWIFCluster(cloudcreds, infra, auth);
    expect(result).toEqual(true);
  });
  it('should return false if cloud credential mode is not Manual', () => {
    const cloudcreds = { spec: { credentialsMode: 'Automatic' } } as CloudCredentialKind;
    const infra = { status: { platform: 'Azure' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: '' } } as AuthenticationKind;
    const result = isAzureWIFCluster(cloudcreds, infra, auth);
    expect(result).toEqual(false);
  });
  it('should return false if infrastructure platform is not Azure', () => {
    const cloudcreds = { spec: { credentialsMode: 'Manual' } } as CloudCredentialKind;
    const infra = { status: { platform: 'GCP' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: '' } } as AuthenticationKind;
    const result = isAzureWIFCluster(cloudcreds, infra, auth);
    expect(result).toEqual(false);
  });
  it('should return false if auth service account issuer is empty', () => {
    const cloudcreds = { spec: { credentialsMode: 'Manual' } } as CloudCredentialKind;
    const infra = { status: { platform: 'Azure' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: '' } } as AuthenticationKind;
    const result = isAzureWIFCluster(cloudcreds, infra, auth);
    expect(result).toEqual(false);
  });
});

describe('isGCPWIFCluster', () => {
  it('should handle undefined arguments', () => {
    const result = isGCPWIFCluster(undefined, undefined, undefined);
    expect(result).toEqual(false);
  });
  it('should return true', () => {
    const cloudcreds = { spec: { credentialsMode: 'Manual' } } as CloudCredentialKind;
    const infra = { status: { platform: 'GCP' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: 'foo' } } as AuthenticationKind;
    const result = isGCPWIFCluster(cloudcreds, infra, auth);
    expect(result).toEqual(true);
  });
  it('should return false if cloud credential mode is not Manual', () => {
    const cloudcreds = { spec: { credentialsMode: 'Automatic' } } as CloudCredentialKind;
    const infra = { status: { platform: 'GCP' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: '' } } as AuthenticationKind;
    const result = isGCPWIFCluster(cloudcreds, infra, auth);
    expect(result).toEqual(false);
  });
  it('should return false if infrastructure platform is not GCP', () => {
    const cloudcreds = { spec: { credentialsMode: 'Manual' } } as CloudCredentialKind;
    const infra = { status: { platform: 'AWS' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: '' } } as AuthenticationKind;
    const result = isGCPWIFCluster(cloudcreds, infra, auth);
    expect(result).toEqual(false);
  });
  it('should return false if auth service account issuer is empty', () => {
    const cloudcreds = { spec: { credentialsMode: 'Manual' } } as CloudCredentialKind;
    const infra = { status: { platform: 'GCP' } } as InfrastructureKind;
    const auth = { spec: { serviceAccountIssuer: '' } } as AuthenticationKind;
    const result = isGCPWIFCluster(cloudcreds, infra, auth);
    expect(result).toEqual(false);
  });
});

describe('isArrayOfStrings', () => {
  it('should return true for empty array', () => {
    const result = isArrayOfStrings([]);
    expect(result).toEqual(true);
  });
  it('should return true for an array containing only strings', () => {
    const result = isArrayOfStrings(['foo', 'bar']);
    expect(result).toEqual(true);
  });
  it('should return false for an array containing non-string elements', () => {
    const result = isArrayOfStrings(['foo', false]);
    expect(result).toEqual(false);
  });
  it('should return false for null', () => {
    const result = isArrayOfStrings(null);
    expect(result).toEqual(false);
  });
  it('should return false for undefined', () => {
    const result = isArrayOfStrings(undefined);
    expect(result).toEqual(false);
  });
});

describe('isK8sResource', () => {
  it('should return false for empty object', () => {
    const result = isK8sResource({});
    expect(result).toEqual(false);
  });
  it('should return false for null', () => {
    const result = isK8sResource(null);
    expect(result).toEqual(false);
  });
  it('should return false for undefined', () => {
    const result = isK8sResource(undefined);
    expect(result).toEqual(false);
  });
  it('should return true for object with metadata.name property', () => {
    const result = isK8sResource({ metadata: { name: 'foo' } });
    expect(result).toEqual(true);
  });
  it('should return false for non-empty object without metadata.name', () => {
    const result = isK8sResource({ foo: 'bar' });
    expect(result).toEqual(false);
  });
});

describe('getClusterServiceVersionPlugins', () => {
  it(`returns correctly parsed value  when ${OLMAnnotation.OperatorPlugins} is set correctly`, () => {
    const result = getClusterServiceVersionPlugins({
      [OLMAnnotation.OperatorPlugins]: '["foo", "bar"]',
    });
    expect(result).toEqual(['foo', 'bar']);
  });
  it(`returns empty array when ${OLMAnnotation.OperatorPlugins} is an empty array`, () => {
    const result = getClusterServiceVersionPlugins({
      [OLMAnnotation.OperatorPlugins]: '[]',
    });
    expect(result).toEqual([]);
  });
  it(`returns empty array when ${OLMAnnotation.OperatorPlugins} is not JSON`, () => {
    const result = getClusterServiceVersionPlugins({
      [OLMAnnotation.OperatorPlugins]: 'foo',
    });
    expect(result).toEqual([]);
  });
  it(`returns empty array when ${OLMAnnotation.OperatorPlugins} is incorrect JSON`, () => {
    const result = getClusterServiceVersionPlugins({
      [OLMAnnotation.OperatorPlugins]: 'false',
    });
    expect(result).toEqual([]);
  });
  it(`returns an empty array when ${OLMAnnotation.OperatorPlugins} annotation is not set`, () => {
    const result = getClusterServiceVersionPlugins({ foo: '["foo", "bar"]' });
    expect(result).toEqual([]);
  });
  it('returns an empty array when annotations are null', () => {
    const result = getClusterServiceVersionPlugins(null);
    expect(result).toEqual([]);
  });
  it('returns an empty array when annotations are undefined', () => {
    const result = getClusterServiceVersionPlugins(undefined);
    expect(result).toEqual([]);
  });
});

describe('getInternalObjects', () => {
  it(`returns correctly parsed value when ${OLMAnnotation.InternalObjects} is set correctly`, () => {
    const result = getInternalObjects({
      [OLMAnnotation.InternalObjects]: '["foo", "bar"]',
    });
    expect(result).toEqual(['foo', 'bar']);
  });
  it(`returns empty array when ${OLMAnnotation.InternalObjects} is not JSON`, () => {
    const result = getInternalObjects({
      [OLMAnnotation.InternalObjects]: 'foo',
    });
    expect(result).toEqual([]);
  });
  it(`returns empty array when ${OLMAnnotation.InternalObjects} is an empty array`, () => {
    const result = getInternalObjects({
      [OLMAnnotation.InternalObjects]: '[]',
    });
    expect(result).toEqual([]);
  });
  it(`returns empty array when ${OLMAnnotation.InternalObjects} is incorrect JSON`, () => {
    const result = getInternalObjects({
      [OLMAnnotation.InternalObjects]: 'false',
    });
    expect(result).toEqual([]);
  });
  it(`returns an empty array when ${OLMAnnotation.InternalObjects} annotation is not set`, () => {
    const result = getInternalObjects({ foo: '["foo", "bar"]' });
    expect(result).toEqual([]);
  });
  it('returns an empty array when annotations are null', () => {
    const result = getInternalObjects(null);
    expect(result).toEqual([]);
  });
  it('returns an empty array when annotations are undefined', () => {
    const result = getInternalObjects(undefined);
    expect(result).toEqual([]);
  });
});

describe('getSuggestedNamespaceTemplate', () => {
  it(`returns correctly parsed value when ${OLMAnnotation.SuggestedNamespaceTemplate} is set correctly`, () => {
    const result = getSuggestedNamespaceTemplate({
      [OLMAnnotation.SuggestedNamespaceTemplate]: '{"metadata":{ "name": "foo" }}',
    });
    expect(result).toEqual({ metadata: { name: 'foo' } });
  });
  it(`returns null when ${OLMAnnotation.SuggestedNamespaceTemplate} is an empty object`, () => {
    const result = getSuggestedNamespaceTemplate({
      [OLMAnnotation.SuggestedNamespaceTemplate]: '{}',
    });
    expect(result).toBeNull();
  });
  it(`returns null when ${OLMAnnotation.SuggestedNamespaceTemplate} is not JSON`, () => {
    const result = getSuggestedNamespaceTemplate({
      [OLMAnnotation.SuggestedNamespaceTemplate]: 'foo',
    });
    expect(result).toBeNull();
  });
  it(`returns null when ${OLMAnnotation.SuggestedNamespaceTemplate} is incorrect JSON`, () => {
    const result = getSuggestedNamespaceTemplate({
      [OLMAnnotation.SuggestedNamespaceTemplate]: 'false',
    });
    expect(result).toBeNull();
  });
  it(`returns null when ${OLMAnnotation.SuggestedNamespaceTemplate} annotation is not set`, () => {
    const result = getSuggestedNamespaceTemplate({ foo: '["foo", "bar"]' });
    expect(result).toBeNull();
  });
  it('returns null when annotations are null', () => {
    const result = getSuggestedNamespaceTemplate(null);
    expect(result).toBeNull();
  });
  it('returns null when annotations are undefined', () => {
    const result = getSuggestedNamespaceTemplate(undefined);
    expect(result).toBeNull();
  });
});

describe('getInitializationResource', () => {
  it(`returns correctly parsed value when ${OLMAnnotation.InitializationResource} is set correctly`, () => {
    const result = getInitializationResource({
      [OLMAnnotation.InitializationResource]: '{"metadata":{ "name": "foo" }}',
    });
    expect(result).toEqual({ metadata: { name: 'foo' } });
  });
  it(`returns null when ${OLMAnnotation.InitializationResource} is an empty object`, () => {
    const result = getInitializationResource({
      [OLMAnnotation.InitializationResource]: '{}',
    });
    expect(result).toBeNull();
  });
  it(`returns null when ${OLMAnnotation.InitializationResource} is not JSON`, () => {
    const result = getInitializationResource({
      [OLMAnnotation.InitializationResource]: 'foo',
    });
    expect(result).toBeNull();
  });
  it(`returns null when ${OLMAnnotation.InitializationResource} is incorrect JSON`, () => {
    const result = getInitializationResource({
      [OLMAnnotation.InitializationResource]: 'false',
    });
    expect(result).toBeNull();
  });
  it(`returns null when ${OLMAnnotation.InitializationResource} annotation is not set`, () => {
    const result = getInitializationResource({ foo: '["foo", "bar"]' });
    expect(result).toBeNull();
  });
  it('returns null when annotations are null', () => {
    const result = getInitializationResource(null);
    expect(result).toBeNull();
  });
  it('returns null when annotations are undefined', () => {
    const result = getInitializationResource(undefined);
    expect(result).toBeNull();
  });
});

describe('getValidSubscription', () => {
  it(`collapses non-Red Hat subscriptions into "${ValidSubscriptionValue.RequiresSeparateSubscription}" filter`, () => {
    const [subscriptions, filters] = getValidSubscription({
      [OLMAnnotation.ValidSubscription]: '["foo", "bar"]',
    });
    expect(subscriptions).toEqual(['foo', 'bar']);
    expect(filters).toEqual([ValidSubscriptionValue.RequiresSeparateSubscription]);
  });
  it(`parses ${ValidSubscriptionValue.OpenShiftContainerPlatform}`, () => {
    const [subscriptions, filters] = getValidSubscription({
      [OLMAnnotation.ValidSubscription]: `["${ValidSubscriptionValue.OpenShiftContainerPlatform}"]`,
    });
    expect(subscriptions).toEqual([ValidSubscriptionValue.OpenShiftContainerPlatform]);
    expect(filters).toEqual([ValidSubscriptionValue.OpenShiftContainerPlatform]);
  });
  it(`parses ${ValidSubscriptionValue.OpenShiftKubernetesEngine}`, () => {
    const [subscriptions, filters] = getValidSubscription({
      [OLMAnnotation.ValidSubscription]: `["${ValidSubscriptionValue.OpenShiftKubernetesEngine}"]`,
    });
    expect(subscriptions).toEqual([
      ValidSubscriptionValue.OpenShiftKubernetesEngine,
      ValidSubscriptionValue.OpenShiftVirtualizationEngine,
    ]);
    expect(filters).toEqual([
      ValidSubscriptionValue.OpenShiftKubernetesEngine,
      ValidSubscriptionValue.OpenShiftVirtualizationEngine,
    ]);
  });
  it(`parses ${ValidSubscriptionValue.OpenShiftPlatformPlus}`, () => {
    const [subscriptions, filters] = getValidSubscription({
      [OLMAnnotation.ValidSubscription]: `["${ValidSubscriptionValue.OpenShiftPlatformPlus}"]`,
    });
    expect(subscriptions).toEqual([ValidSubscriptionValue.OpenShiftPlatformPlus]);
    expect(filters).toEqual([ValidSubscriptionValue.OpenShiftPlatformPlus]);
  });
  it(`parses all valid subscription values`, () => {
    const [subscriptions, filters] = getValidSubscription({
      [OLMAnnotation.ValidSubscription]: `["${ValidSubscriptionValue.OpenShiftContainerPlatform}", "${ValidSubscriptionValue.OpenShiftKubernetesEngine}", "${ValidSubscriptionValue.OpenShiftPlatformPlus}", "foo", "bar"]`,
    });
    expect(subscriptions).toEqual([
      ValidSubscriptionValue.OpenShiftContainerPlatform,
      ValidSubscriptionValue.OpenShiftKubernetesEngine,
      ValidSubscriptionValue.OpenShiftVirtualizationEngine,
      ValidSubscriptionValue.OpenShiftPlatformPlus,
      'foo',
      'bar',
    ]);
    expect(filters).toEqual([
      ValidSubscriptionValue.OpenShiftContainerPlatform,
      ValidSubscriptionValue.OpenShiftKubernetesEngine,
      ValidSubscriptionValue.OpenShiftVirtualizationEngine,
      ValidSubscriptionValue.OpenShiftPlatformPlus,
      ValidSubscriptionValue.RequiresSeparateSubscription,
    ]);
  });
  it(`returns empty when ${OLMAnnotation.ValidSubscription} is an empty array`, () => {
    const [subscriptions, filters] = getValidSubscription({
      [OLMAnnotation.ValidSubscription]: '[]',
    });
    expect(subscriptions).toEqual([]);
    expect(filters).toEqual([]);
  });
  it(`returns empty when ${OLMAnnotation.ValidSubscription} is not JSON`, () => {
    const [subscriptions, filters] = getValidSubscription({
      [OLMAnnotation.ValidSubscription]: 'foo',
    });
    expect(subscriptions).toEqual([]);
    expect(filters).toEqual([]);
  });
  it(`returns empty when ${OLMAnnotation.ValidSubscription} is incorrect JSON`, () => {
    const [subscriptions, filters] = getValidSubscription({
      [OLMAnnotation.ValidSubscription]: 'false',
    });
    expect(subscriptions).toEqual([]);
    expect(filters).toEqual([]);
  });
  it(`returns an empty when ${OLMAnnotation.ValidSubscription} annotation is not set`, () => {
    const [subscriptions, filters] = getValidSubscription({ foo: '["foo", "bar"]' });
    expect(subscriptions).toEqual([]);
    expect(filters).toEqual([]);
  });
  it('returns an empty when annotations are null', () => {
    const [subscriptions, filters] = getValidSubscription(null);
    expect(subscriptions).toEqual([]);
    expect(filters).toEqual([]);
  });
  it('returns an empty when annotations are undefined', () => {
    const [subscriptions, filters] = getValidSubscription(undefined);
    expect(subscriptions).toEqual([]);
    expect(filters).toEqual([]);
  });
});

describe('getInfrastructureFeatures', () => {
  it(`correctly normalizes mutations of legacy annotation values`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = false;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.InfrastructureFeatures]:
          '["disconnected","Disconnected","Proxy","ProxyAware","proxy-aware","FipsMode","fips","FIPS","tlsProfiles","TLSProfiles","tls","TLS","cnf","CNF","cni","CNI","csi","CSI","sno","SNO", "tokenAuth", "TokenAuth", "tokenAuthGCP", "TokenAuthGCP"]',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([
      InfrastructureFeature.Disconnected,
      InfrastructureFeature.ProxyAware,
      InfrastructureFeature.FIPSMode,
      InfrastructureFeature.TLSProfiles,
      InfrastructureFeature.CNF,
      InfrastructureFeature.CNI,
      InfrastructureFeature.CSI,
      InfrastructureFeature.SNO,
    ]);
  });
  it(`includes normalized legacy "tokenAuth" feature on AWS STS cluster`, () => {
    const clusterIsAWSSTS = true;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = false;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.InfrastructureFeatures]: '["tokenAuth"]',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([InfrastructureFeature.TokenAuth]);
  });
  it(`includes normalized legacy "TokenAuth" feature on AWS STS cluster`, () => {
    const clusterIsAWSSTS = true;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = false;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.InfrastructureFeatures]: '["TokenAuth"]',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([InfrastructureFeature.TokenAuth]);
  });
  it(`includes normalized legacy "tokenAuth" feature on Azure WIF cluster`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = true;
    const clusterIsGCPWIF = false;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.InfrastructureFeatures]: '["tokenAuth"]',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([InfrastructureFeature.TokenAuth]);
  });
  it(`includes normalized legacy "TokenAuth" feature on Azure WIF cluster`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = true;
    const clusterIsGCPWIF = false;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.InfrastructureFeatures]: '["TokenAuth"]',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([InfrastructureFeature.TokenAuth]);
  });
  it(`excludes legacy token auth feature when not AWS STS or Azure WIF cluster`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = false;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.InfrastructureFeatures]: '["tokenAuth","TokenAuth"]',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([]);
  });
  it(`includes normalized legacy "tokenAuthGCP" feature when on GCP WIF cluster`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = true;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.InfrastructureFeatures]: '["tokenAuthGCP"]',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([InfrastructureFeature.TokenAuthGCP]);
  });
  it(`includes normalized legacy "TokenAuthGCP" feature when on GCP WIF cluster`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = true;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.InfrastructureFeatures]: '["TokenAuthGCP"]',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([InfrastructureFeature.TokenAuthGCP]);
  });
  it(`excludes legacy token auth GCP feature when not GCP WIF cluster`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = false;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.InfrastructureFeatures]: '["TokenAuthGCP"]',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([]);
  });
  it(`includes features defined by latest annotation format`, () => {
    const clusterIsAWSSTS = true;
    const clusterIsAzureWIF = true;
    const clusterIsGCPWIF = true;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.Disconnected]: 'true',
        [OLMAnnotation.FIPSCompliant]: 'true',
        [OLMAnnotation.ProxyAware]: 'true',
        [OLMAnnotation.CNF]: 'true',
        [OLMAnnotation.CNI]: 'true',
        [OLMAnnotation.CSI]: 'true',
        [OLMAnnotation.TLSProfiles]: 'true',
        [OLMAnnotation.TokenAuthAWS]: 'true',
        [OLMAnnotation.TokenAuthAzure]: 'true',
        [OLMAnnotation.TokenAuthGCP]: 'true',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([
      InfrastructureFeature.Disconnected,
      InfrastructureFeature.FIPSMode,
      InfrastructureFeature.ProxyAware,
      InfrastructureFeature.CNF,
      InfrastructureFeature.CNI,
      InfrastructureFeature.CSI,
      InfrastructureFeature.TLSProfiles,
      InfrastructureFeature.TokenAuth,
      InfrastructureFeature.TokenAuthGCP,
    ]);
  });
  it(`only includes one feature when repeated by legacy and latest annotation format`, () => {
    const result = getInfrastructureFeatures({
      [OLMAnnotation.InfrastructureFeatures]: '["Disconnected", "fips"]',
      [OLMAnnotation.Disconnected]: 'true',
    });
    expect(result).toEqual([InfrastructureFeature.Disconnected, InfrastructureFeature.FIPSMode]);
  });
  it(`excludes legacy feature when negated by latest annotation format`, () => {
    const result = getInfrastructureFeatures({
      [OLMAnnotation.InfrastructureFeatures]: '["Disconnected", "fips"]',
      [OLMAnnotation.Disconnected]: 'false',
    });
    expect(result).toEqual([InfrastructureFeature.FIPSMode]);
  });
  it(`returns empty array when ${OLMAnnotation.InfrastructureFeatures} is empty`, () => {
    const result = getInfrastructureFeatures({
      [OLMAnnotation.InfrastructureFeatures]: '[]',
    });
    expect(result).toEqual([]);
  });
  it(`returns empty array when ${OLMAnnotation.InfrastructureFeatures} is not JSON`, () => {
    const result = getInfrastructureFeatures({
      [OLMAnnotation.InfrastructureFeatures]: 'foo',
    });
    expect(result).toEqual([]);
  });
  it(`returns empty array when ${OLMAnnotation.InfrastructureFeatures} is incorrect JSON`, () => {
    const result = getInfrastructureFeatures({
      [OLMAnnotation.InfrastructureFeatures]: 'false',
    });
    expect(result).toEqual([]);
  });
  it(`returns an empty array when ${OLMAnnotation.InfrastructureFeatures} annotation is not set`, () => {
    const result = getInfrastructureFeatures({ foo: '["foo", "bar"]' });
    expect(result).toEqual([]);
  });
  it('returns an empty array when annotations are null', () => {
    const result = getInfrastructureFeatures(null);
    expect(result).toEqual([]);
  });
  it('returns an empty array when annotations are undefined', () => {
    const result = getInfrastructureFeatures(undefined);
    expect(result).toEqual([]);
  });
});

describe('operatorHubItemToCatalogItem', () => {
  const createMockOperatorHubItem = (
    overrides: Partial<OperatorHubItem> = {},
  ): OperatorHubItem => ({
    uid: 'test-operator-uid',
    name: 'Test Operator',
    description: 'Test operator description',
    provider: 'Test Provider',
    tags: ['tag1', 'tag2'],
    obj: {
      metadata: {
        name: 'test-operator-metadata',
      },
    } as PackageManifestKind,
    // Required OperatorHubItem properties with defaults
    authentication: {} as any,
    catalogSource: 'test-catalog',
    catalogSourceNamespace: 'test-namespace',
    categories: [],
    cloudCredentials: {} as any,
    infraFeatures: [],
    infrastructure: {} as any,
    installed: false,
    kind: 'PackageManifest',
    longDescription: 'Long description',
    source: 'test-source',
    validSubscription: [],
    ...overrides,
  });

  describe('error handling', () => {
    it('should throw error when item is null', () => {
      expect(() => operatorHubItemToCatalogItem(null as any)).toThrow(
        'operatorHubItemToCatalogItem: item is required',
      );
    });

    it('should throw error when item is undefined', () => {
      expect(() => operatorHubItemToCatalogItem(undefined as any)).toThrow(
        'operatorHubItemToCatalogItem: item is required',
      );
    });

    it('should throw error when item.uid is missing', () => {
      const item = createMockOperatorHubItem({ uid: '' });
      expect(() => operatorHubItemToCatalogItem(item)).toThrow(
        'operatorHubItemToCatalogItem: item.uid is required',
      );
    });

    it('should throw error when item.name is missing', () => {
      const item = createMockOperatorHubItem({ name: '' });
      expect(() => operatorHubItemToCatalogItem(item)).toThrow(
        'operatorHubItemToCatalogItem: item.name is required',
      );
    });
  });

  describe('fallback handling', () => {
    it('should provide fallback for missing description', () => {
      const item = createMockOperatorHubItem({ description: undefined as any });
      const result = operatorHubItemToCatalogItem(item);
      expect(result.description).toBe('');
    });

    it('should provide fallback for missing provider', () => {
      const item = createMockOperatorHubItem({ provider: undefined as any });
      const result = operatorHubItemToCatalogItem(item);
      expect(result.provider).toBe('Unknown Provider');
      expect(result.attributes?.provider).toBe('Unknown Provider');
    });

    it('should provide fallback for missing tags', () => {
      const item = createMockOperatorHubItem({ tags: undefined as any });
      const result = operatorHubItemToCatalogItem(item);
      expect(result.tags).toEqual([]);
    });

    it('should handle non-array tags', () => {
      const item = createMockOperatorHubItem({ tags: 'not-an-array' as any });
      const result = operatorHubItemToCatalogItem(item);
      expect(result.tags).toEqual([]);
    });

    it('should provide fallback for missing keywords', () => {
      const item = createMockOperatorHubItem();
      const result = operatorHubItemToCatalogItem(item);
      expect(result.attributes?.keywords).toEqual([]);
    });

    it('should filter invalid keywords', () => {
      const item = createMockOperatorHubItem();
      (item as any).keywords = ['valid-keyword', '', '   ', null, undefined, 123, 'another-valid'];
      const result = operatorHubItemToCatalogItem(item);
      expect(result.attributes?.keywords).toEqual(['valid-keyword', 'another-valid']);
    });

    it('should handle missing metadata gracefully', () => {
      const item = createMockOperatorHubItem({ obj: undefined as any });
      const result = operatorHubItemToCatalogItem(item);
      expect(result.attributes?.metadataName).toBeUndefined();
    });

    it('should handle missing obj.metadata gracefully', () => {
      const item = createMockOperatorHubItem({
        obj: { metadata: undefined } as any,
      });
      const result = operatorHubItemToCatalogItem(item);
      expect(result.attributes?.metadataName).toBeUndefined();
    });

    it('should handle non-string metadata name gracefully', () => {
      const item = createMockOperatorHubItem({
        obj: { metadata: { name: 123 } } as any,
      });
      const result = operatorHubItemToCatalogItem(item);
      expect(result.attributes?.metadataName).toBeUndefined();
    });
  });

  describe('successful conversion', () => {
    it('should convert valid OperatorHubItem to CatalogItem', () => {
      const item = createMockOperatorHubItem();
      (item as any).keywords = ['keyword1', 'keyword2'];

      const result = operatorHubItemToCatalogItem(item);

      expect(result).toEqual({
        uid: 'test-operator-uid',
        name: 'Test Operator',
        title: 'Test Operator',
        type: 'operator',
        description: 'Test operator description',
        provider: 'Test Provider',
        tags: ['tag1', 'tag2'],
        attributes: {
          keywords: ['keyword1', 'keyword2'],
          provider: 'Test Provider',
          metadataName: 'test-operator-metadata',
        },
      });
    });

    it('should handle minimal valid item', () => {
      const minimalItem = {
        uid: 'minimal-uid',
        name: 'Minimal Operator',
      } as OperatorHubItem;

      const result = operatorHubItemToCatalogItem(minimalItem);

      expect(result.uid).toBe('minimal-uid');
      expect(result.name).toBe('Minimal Operator');
      expect(result.description).toBe('');
      expect(result.provider).toBe('Unknown Provider');
      expect(result.tags).toEqual([]);
      expect(result.attributes?.keywords).toEqual([]);
      expect(result.attributes?.metadataName).toBeUndefined();
    });
  });
});
