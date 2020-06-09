import { browser } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import {
  changeChannel,
  changeCatalogSourceImage,
  channelChangeButton,
  channel43,
  channel44,
  channel45,
  operatorVersion,
  waitUntilStorageClusterReady,
} from '../../views/upgrade.view';
import { CHANNEL_43, CHANNEL_44, CHANNEL_45, MINUTE } from '../../utils/consts';

describe('Test OCS version upgrade.', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/`);
    jasmine.DEFAULT_TIMEOUT_INTERVAL += 120 * MINUTE;
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL -= 120 * MINUTE;
  });

  it('Test channel change from 4.2 to 4.3', async () => {
    // Pre-requisites: OCS 4.2 is installed
    await changeCatalogSourceImage('latest-stable-4.3.0');
    await changeChannel(channel43);
    expect(channelChangeButton.getText()).toEqual(CHANNEL_43);
  });

  it('Test that OCS operator version changed to 4.3', async () => {
    await waitUntilStorageClusterReady();
    expect(operatorVersion()).toContain('4.3.');
  });

  it('Test channel change from 4.3 to 4.4', async () => {
    await changeCatalogSourceImage('latest-stable-4.4.0');
    await changeChannel(channel44);
    expect(channelChangeButton.getText()).toEqual(CHANNEL_44);
  });

  it('Test that OCS operator version changed to 4.4', async () => {
    await waitUntilStorageClusterReady();
    expect(operatorVersion()).toContain('4.4.');
  });

  xit('Test channel change from 4.4 to 4.5', async () => {
    // await changeCatalogSourceImage('latest-stable-4.5.0');
    await changeChannel(channel45);
    expect(channelChangeButton.getText()).toEqual(CHANNEL_45);
  });

  xit('Test that OCS operator version changed to 4.5', async () => {
    await waitUntilStorageClusterReady();
    expect(operatorVersion()).toContain('4.5.');
  });
});
