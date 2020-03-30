import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { securityHealthHandler } from '../summary';
import { ImageManifestVuln } from '../../types';

const highVuln: ImageManifestVuln = {
  apiVersion: 'secscan.quay.redhat.com/v1alpha1',
  kind: 'ImageManifestVuln',
  metadata: {
    name: 'sha256.0208a7a39ace0fbfeb537526515006c1259139fa78b3b4889cf04f8e44d5442f',
  },
  spec: {
    features: [],
    image: 'quay.io/coreos/example',
    manifest: 'sha256:0208a7a39ace0fbfeb537526515006c1259139fa78b3b4889cf04f8e44d5442f',
    namespaceName: 'centos:7',
  },
  status: {
    affectedPods: {
      'test/some-pod': ['cri-o://524638ef02d6da6bfe48650663f838f9f2fbe1e9769f886863fe509bc74b75ef'],
    },
    fixableCount: 61,
    highCount: 14,
    highestSeverity: 'High',
    lowCount: 14,
    mediumCount: 33,
  },
};

describe('securityHealthHandler', () => {
  it('returns `UNKNOWN` status if there is an error retrieving `ImageManifestVulns`', () => {
    const vulnerabilities = {
      imageManifestVuln: { loaded: true, loadError: 'failed to fetch', data: [] },
    };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.UNKNOWN);
  });

  it('returns `LOADING` status if still retrieving `ImageManifestVulns`', () => {
    const vulnerabilities = { imageManifestVuln: { loaded: false, loadError: null, data: [] } };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.LOADING);
  });

  it('returns `Error` status if any `ImageManifestVulns` exist', () => {
    const vulnerabilities = {
      imageManifestVuln: { loaded: true, loadError: null, data: [highVuln] },
    };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.ERROR);
  });

  it('returns `OK` status if no vulnerabilities', () => {
    const vulnerabilities = { imageManifestVuln: { loaded: true, loadError: null, data: [] } };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.OK);
  });
});
