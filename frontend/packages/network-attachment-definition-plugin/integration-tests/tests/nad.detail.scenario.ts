import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { createResource, deleteResource } from '@console/shared/src/test-utils/utils';
import * as nadDetailView from '../views/nad.detail.view';
import { NetworkAttachmentDefinition } from './models/nad';
import { getNADManifest } from './utils/mocks';
import { CNV_BRIDGE } from './utils/constants';

describe('Test NAD overview', () => {
  const namespace = testName;
  const nadName = `nad-${namespace}`;
  const testNAD = getNADManifest(namespace, nadName, CNV_BRIDGE);
  const nad = new NetworkAttachmentDefinition(testNAD.metadata);

  beforeAll(() => {
    createResource(testNAD);
  });

  afterAll(() => {
    deleteResource(testNAD);
  });

  beforeEach(async () => {
    await nad.navigateToDetail();
    await isLoaded();
  });

  it('ID(CNV-4291) Check NAD details in overview', async () => {
    // check NAD
    const expected = {
      name: nadName,
      description: namespace,
      type: CNV_BRIDGE,
    };

    const found = {
      name: await nadDetailView.nadDetailName(testName, nadName).getText(),
      description: await nadDetailView.nadDetailDescription(testName, nadName).getText(),
      type: await nadDetailView.nadDetailType(testName, nadName).getText(),
    };

    const equal = _.isEqual(found, expected);
    if (!equal) {
      // eslint-disable-next-line no-console
      console.error(`Expected:\n${JSON.stringify(expected)},\nGot:\n${JSON.stringify(found)}`);
    }
    expect(equal).toBe(true);
  });
});
