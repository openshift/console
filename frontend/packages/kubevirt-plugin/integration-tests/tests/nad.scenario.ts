import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { withResource } from '@console/shared/src/test-utils/utils';
import { NAD } from './models/nad';

describe('Kubevirt create NAD using wizard', () => {
  const leakedResources = new Set<string>();

  it('Create NAD using wizard', async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/k8s.cni.cncf.io~v1~NetworkAttachmentDefinition`);
    const nadConfig = {
      name: `nad-${testName}`,
      description: `nad-desc-${testName}`,
      networkType: 'CNV Linux bridge',
      bridgeName: 'br0',
    }; 
    const nad = new NAD();
    await withResource(leakedResources, nad.asResource(), async () => {
      await nad.create(nadConfig);
    });
  });

});
