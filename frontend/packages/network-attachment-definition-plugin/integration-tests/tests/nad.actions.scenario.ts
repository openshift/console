import { dump, load } from 'js-yaml';
import * as _ from 'lodash';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import {
  saveButton,
  getEditorContent,
  setEditorContent,
} from '@console/internal-integration-tests/views/yaml.view';
import { click, createResource } from '@console/shared/src/test-utils/utils';
import * as nadDetailView from '../views/nad.detail.view';
import { NetworkAttachmentDefinition } from './models/nad';
import { CNV_BRIDGE, NAD_ACTION } from './utils/constants';
import { getNADManifest } from './utils/mocks';

describe('Test NAD actions', () => {
  const nadName = `nad-${testName}`;
  const testNAD = getNADManifest(testName, nadName, CNV_BRIDGE);
  const nad = new NetworkAttachmentDefinition(testNAD.metadata);

  beforeEach(async () => {
    createResource(testNAD);
    await isLoaded();
  });

  it('ID(CNV-4289) Delete NAD in details view', async () => {
    await nad.detailViewAction(NAD_ACTION.Delete);
  });

  it('ID(CNV-4288) Delete NAD in list view', async () => {
    await nad.listViewAction(NAD_ACTION.Delete);
  });

  it('ID(CNV-4287) Edit NAD in details view', async () => {
    const newDesc = `New description for ${nadName}`;

    await nad.detailViewAction(NAD_ACTION.Edit);
    await isLoaded();

    const newContent = _.defaultsDeep(
      {},
      {
        metadata: { annotations: { description: newDesc } },
      },
      load(await getEditorContent()),
    );

    await setEditorContent(dump(newContent));
    await click(saveButton);

    await nad.navigateToDetail();
    const getDesc = await nadDetailView.nadDetailDescription(testName, nadName).getText();
    expect(getDesc).toEqual(newDesc);

    await nad.detailViewAction(NAD_ACTION.Delete);
    await isLoaded();
  });
});
