const navigate = (browser, path, cb) => {
  const url = browser.launch_url + path;
  browser.url(url, ({error, value}) => {
    if (error) {
      console.error(value);
      process.exit(1);
    }
    console.log('navigated to ', url);
    cb();
  });
};

const TIMEOUT = 4000;

const exports_ = {};

[
  'deployments',
  'replicasets',
  'replicationcontrollers',
  'daemonsets',
  'jobs',
  'pods',
  'configmaps',
  'secrets',
  'etcdclusters',
  'prometheuses',
  'ingresses',
  'networkpolicies',
  'services',
  // 'namespaces', // TODO: (kans) special case
  // 'serviceaccounts', // TODO: (kans) not support ...
  'roles',
].forEach(resource => {
  exports_[`YAML - ${resource}`] = browser => {
    const utils = browser.page.utils();

    console.log('Testing', resource);
    navigate(browser, `/all-namespaces/${resource}`, () => {
      utils
        .waitForElementVisible('@CreateYAMLButton', TIMEOUT)
        .click('@CreateYAMLButton')
        .click('@saveYAMLButton')
        .waitForElementVisible('@actionsDropdownButton', TIMEOUT);

      browser.assert.urlContains('/example/details');

      utils
        .click('@actionsDropdownButton')
        .click('@actionsDropdownDeleteLink')
        .waitForElementVisible('@deleteModalConfirmButton', TIMEOUT)
        .click('@deleteModalConfirmButton')
        .waitForElementVisible('@CreateYAMLButton', TIMEOUT);
    });
  };
});

exports_.after = browser => browser.end();

module.exports = exports_;
