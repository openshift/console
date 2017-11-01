module.exports = {
  elements: {
    expandClusterUpdatesLink: {
      selector: '#expand-cluster-updates',
      locateStrategy: 'css selector',
    },
    showDetailsLink: {
      selector: '//button[contains(@class, "co-cluster-updates__operator-show-details")]',
      locateStrategy: 'xpath'
    },
    channelState: {
      selector: '#channel-state',
      locateStrategy: 'css selector',
    },
    updatesButton: {
      selector: '//button[contains(@class, "co-cluster-updates__action-button")]',
      locateStrategy: 'xpath'
    },
    uptoDateDiv: {
      selector: '//div[contains(@class, "co-cluster-updates__operator-icon co-cluster-updates__operator-icon--up-to-date")]',
      locateStrategy: 'xpath'
    },
    pendingUpdatesDiv: {
      selector: '//div[contains(@class, "co-cluster-updates__operator-icon co-cluster-updates__operator-icon--pending")]',
      locateStrategy: 'xpath'
    },
    updatingSpan: {
      selector: '//span[contains(@class, "co-cluster-updates__operator-subheader")]',
      locateStrategy: 'xpath'
    },
    updateTCODiv: {
      selector: '//div[@data-id="Update Tectonic Operators"]',
      locateStrategy: 'xpath'
    },
    updateAppVersionDiv: {
      selector: '//div[@data-id="Update AppVersion components"]',
      locateStrategy: 'xpath'
    },
    cleanupStatusDiv: {
      selector: '//div[@data-id="Cleanup unwanted old resources"]',
      locateStrategy: 'xpath'
    }
  }
};
