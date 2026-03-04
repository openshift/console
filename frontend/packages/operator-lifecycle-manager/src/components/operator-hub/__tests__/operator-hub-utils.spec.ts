import type {
  AuthenticationKind,
  CloudCredentialKind,
  InfrastructureKind,
} from '@console/internal/module/k8s';
import type { PackageManifestKind } from '../../../types';
import { InfrastructureFeature, OLMAnnotation, ValidSubscriptionValue } from '../index';
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
} from '../operator-hub-utils';

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
        [OLMAnnotation.TokenAuthAWS]: 'true',
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
        [OLMAnnotation.TokenAuthAWS]: 'true',
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
        [OLMAnnotation.TokenAuthAzure]: 'true',
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
        [OLMAnnotation.TokenAuthAzure]: 'true',
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
        [OLMAnnotation.TokenAuthGCP]: 'true',
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
        [OLMAnnotation.TokenAuthGCP]: 'true',
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
  it(`excludes token auth GCP feature when annotation is explicitly set to false`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = true;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.TokenAuthGCP]: 'false',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([]);
  });
  it(`excludes legacy token auth GCP feature when annotation is explicitly set to false on GCP WIF cluster`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = true;
    const result = getInfrastructureFeatures(
      {
        [OLMAnnotation.InfrastructureFeatures]: '["TokenAuthGCP"]',
        [OLMAnnotation.TokenAuthGCP]: 'false',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([]);
  });
  it(`excludes token auth AWS feature when annotation is not present on AWS STS cluster`, () => {
    const clusterIsAWSSTS = true;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = false;
    const result = getInfrastructureFeatures(
      {}, // No TokenAuthAWS annotation
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([]);
    expect(result).not.toContain(InfrastructureFeature.TokenAuth);
  });
  it(`excludes token auth Azure feature when annotation is not present on Azure WIF cluster`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = true;
    const clusterIsGCPWIF = false;
    const result = getInfrastructureFeatures(
      {}, // No TokenAuthAzure annotation
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([]);
    expect(result).not.toContain(InfrastructureFeature.TokenAuth);
  });
  it(`excludes token auth GCP feature when annotation is not present on GCP WIF cluster`, () => {
    const clusterIsAWSSTS = false;
    const clusterIsAzureWIF = false;
    const clusterIsGCPWIF = true;
    const result = getInfrastructureFeatures(
      {}, // No TokenAuthGCP annotation
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(result).toEqual([]);
    expect(result).not.toContain(InfrastructureFeature.TokenAuthGCP);
  });
  it(`requires explicit true annotation for all token auth providers (opt-in behavior)`, () => {
    const clusterIsAWSSTS = true;
    const clusterIsAzureWIF = true;
    const clusterIsGCPWIF = true;
    // Test with annotations missing
    const resultMissing = getInfrastructureFeatures(
      {},
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(resultMissing).toEqual([]);
    // Test with annotations set to 'false'
    const resultFalse = getInfrastructureFeatures(
      {
        [OLMAnnotation.TokenAuthAWS]: 'false',
        [OLMAnnotation.TokenAuthAzure]: 'false',
        [OLMAnnotation.TokenAuthGCP]: 'false',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(resultFalse).toEqual([]);
    // Test with annotations set to 'true' - only this should include features
    const resultTrue = getInfrastructureFeatures(
      {
        [OLMAnnotation.TokenAuthAWS]: 'true',
        [OLMAnnotation.TokenAuthAzure]: 'true',
        [OLMAnnotation.TokenAuthGCP]: 'true',
      },
      { clusterIsAWSSTS, clusterIsAzureWIF, clusterIsGCPWIF },
    );
    expect(resultTrue).toContain(InfrastructureFeature.TokenAuth);
    expect(resultTrue).toContain(InfrastructureFeature.TokenAuthGCP);
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
