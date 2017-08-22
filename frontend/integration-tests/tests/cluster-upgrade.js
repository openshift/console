const _ = require('lodash');
const TIMEOUT = 4000;
const UPGRADE_TIMEOUT = 10000;

const clusterUpgradeTests_ = {};

const initTest = (browser, cb) => {
  const clusterUpgradePage = browser.page.clusterUpgradePage();
  const url = `${browser.launch_url}/settings/cluster`;
  clusterUpgradePage
    .navigate(url)
    .waitForElementVisible('@expandClusterUpdatesLink', TIMEOUT)
    .click('@expandClusterUpdatesLink')
    .getText('@channelState', ({value}) => cb(value, clusterUpgradePage));
};

const assertChannelState = (channelState, client) => {
  console.log(`Asserting State for ${channelState}`);
  if (channelState === 'Up to date') {
    client.expect.element('@uptoDateDiv').to.be.visible;
  } else if (_.endsWith(channelState, 'is available')) {
    client.expect.element('@pendingUpdatesDiv').to.be.visible;
  } else if (channelState === 'Updating' || channelState === 'Paused...') {
    client.expect.element('@updatingSpan').to.be.visible;
  }
};

const assertUpdatingStatus = (channelState, client) => {
  console.log(`Asserting Status for ${channelState}`);
  client.expect.element('@updateTCODiv').to.be.visible;
  client.expect.element('@updateAppVersionDiv').to.be.visible;
  client.expect.element('@cleanupStatusDiv').to.be.visible;
};

clusterUpgradeTests_['Check for Updates'] = browser => {
  initTest(browser, assertChannelState);
};

clusterUpgradeTests_['Trigger Updates'] = browser => {
  initTest(browser, (channelState, clusterUpgradePage) => {
    if (channelState !== 'Up to date') {
      if (_.endsWith(channelState, 'is available') || channelState === 'Paused...') {
        clusterUpgradePage.click('@updatesButton')
          .waitForElementVisible('@showDetailsLink', TIMEOUT);
      } else if (channelState === 'Updating') {
        clusterUpgradePage.click('@showDetailsLink');
      }

      clusterUpgradePage.click('@showDetailsLink');
      assertUpdatingStatus(channelState, clusterUpgradePage);
      //TODO: [amrutac] This could take longer, figure out a way to retry this test.
      clusterUpgradePage.waitForElementVisible('@uptoDateDiv', UPGRADE_TIMEOUT)
        .getText('@channelState', ({value}) => {
          clusterUpgradePage.verify.equal(value, 'Up to date');
        });
    } else {
      console.log('Updates are not available at this time.');
    }

  });
};

clusterUpgradeTests_.after = browser => browser.end();

module.exports = clusterUpgradeTests_;
