// eslint-disable-next-line camelcase
const child_process = require('child_process');

const _ = require('lodash');
const async = require('async');
const { safeLoad, safeDump } = require('js-yaml');

const TIMEOUT = 15000;
const TEST_LABEL = 'automatedTestName';

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

const generateName = (prefix, length) => {
  let s = prefix || '';
  while (s.length < length) {
    s += Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
  }
  return s.substr(0, length);
};

const NAME = generateName(process.env.NAME || 'qa-test-', 18);

const h1 = text => console.log(`
============================================

  ${text}

============================================
`);

h1(`Using Name ${NAME}`);

const seriesCB = browser => err => {
  if (err) {
    console.error('\n\n\n----', err, '----\n\n\n');
  }

  browser.assert.equal(err, undefined, 'No Errors were thrown.');
};


// Will cb() after a <StatusBox /> has "loaded" its contents.
const loadStatusBox = (browser, i, cb) => {
  if (i > 10) {
    return new Error('Did not load list in time.');
  }

  /* This is literally execing in the browser!
    - No libraries.
    - No typescript.
    - No sweet sweet ES2017.
    - Top-level function can't be fat arrow. (because `this`)
   */
  browser.execute(function () {
    const loadingBox = document.getElementsByClassName('loading-box')[0];
    if (!loadingBox) {
      return 'loading';
    }
    const loadingBoxClass = loadingBox.getAttribute('class');
    return loadingBoxClass.split(' ').map(css => css.split('__')[1]).filter(x => x)[0];
  }, ({value}) => {
    switch (value) {
      case 'loading':
        browser.pause(500);
        loadStatusBox(browser, i+1, cb);
        return;
      case 'loaded':
        return cb(null, value);
      case 'errored':
        return cb(new Error('Error loading list'));
      default:
        return cb(new Error(`Unknown error loading list:\n${value.message}\n`));
    }
  });
};

const deleteExamples = (page, browser, cb) => {
  const deleteExample = ids => {
    if (ids.length === 0) {
      return cb();
    }
    const selector = `#${ids[0]}`;
    const css = `${selector} li:last-child a`;
    browser.pause(100);
    // TODO: fail if all deletes fail
    browser.isVisible(selector, ({status}) => {
      if (status) {
        console.error('No delete dropdown for ', selector);
        return deleteExample(ids.slice(1));
      }
      page.click(selector)
        .waitForElementPresent(css, TIMEOUT)
        .click(css)
        .waitForElementPresent('@deleteModalConfirmButton', TIMEOUT)
        .click('@deleteModalConfirmButton')
        .waitForElementPresent('@CreateYAMLButton', TIMEOUT, () => {
          deleteExample(ids.slice(1));
        });
    });
  };

  loadStatusBox(browser, 0, error => {
    if (error) {
      return cb(error);
    }

    browser.execute(function () {
      return Array.from(document.querySelectorAll('div.co-m-cog-wrapper')).map(d => d.getAttribute('id'));
    }, ({value}) => deleteExample(value));
  });
};

const updateYamlEditor = (browser, cb) => {
  browser.execute(function () {
    return window.ace.getValue();
  }, ({value}) => {
    const json = safeLoad(value);
    json.metadata.name = NAME;
    json.metadata.labels = json.metadata.labels || {};
    // Apply "automatedTest" label for easier manual cleanup :-/
    json.metadata.labels.automatedTest = 'true';
    json.metadata.labels[TEST_LABEL] = NAME;
    const yaml = safeDump(json);
    browser.execute(function (yaml) {
      return window.ace.setValue(yaml);
    }, [yaml], result => {
      browser.assert.equal(result.status, 0, 'Updated name and label via ace.');
      cb();
    });
  });
};

const createExamples = (page, browser, cb) =>
  async.series([
    cb => page
      .waitForElementPresent('@CreateYAMLButton', TIMEOUT)
      .click('@CreateYAMLButton')
      .waitForElementPresent('@saveYAMLButton', TIMEOUT, true, () =>cb()),
    cb => updateYamlEditor(browser, cb),
    cb => page
      .click('@saveYAMLButton')
      .waitForElementPresent('@actionsDropdownButton', TIMEOUT, true, () => cb()),
    cb => {
      browser.verify.urlContains(`/${NAME}`);
      cb();
    },
  ], cb);

const k8sObjs = {
  'pods': 'Pod',
  'services': 'Service',
  'serviceaccounts': 'ServiceAccount',
  'secrets': 'Secret',
  'configmaps': 'ConfigMap',
  'persistentvolumes': 'PersistentVolume',
  'ingresses': 'Ingress',
  // Meta resources
  'cronjobs': 'CronJob',
  'jobs': 'Job',
  'daemonsets': 'DaemonSet',
  'deployments': 'Deployment',
  'replicasets': 'ReplicaSet',
  'replicationcontrollers': 'ReplicationController',
  'etcdclusters': 'EtcdCluster',
  'prometheuses': 'Prometheus',
  'persistentvolumeclaims': 'PersistentVolumeClaim',
  'statefulsets': 'StatefulSet',
  'resourcequotas': 'ResourceQuota',
  'networkpolicies': 'NetworkPolicy',
  'roles': 'Role',
};

const LEAKED_RESOURCES = new Set();
let RESOURCES_CREATED = 0;
const onCreatedResource = (name, plural, namespace, cb) => {
  const resource = {name, plural};
  if (namespace) {
    resource.namespace = namespace;
  }
  LEAKED_RESOURCES.add(JSON.stringify(resource));
  RESOURCES_CREATED += 1;
  cb();
};

const onDeletedResource = (name, plural, namespace, cb) => {
  const resource = {name, plural};
  if (namespace) {
    resource.namespace = namespace;
  }
  LEAKED_RESOURCES.delete(JSON.stringify(resource));
  cb();
};

const namespacedResourcesTests = {};

namespacedResourcesTests.before = browser => {
  console.log(`creating namespace ${NAME}`);

  async.series([
    cb => navigate(browser, '/namespaces', cb),
    cb => onCreatedResource(NAME, 'namespaces', undefined, cb),
    cb => browser.page.crudPage()
      .waitForElementPresent('@CreateYAMLButton', TIMEOUT)
      .click('@CreateYAMLButton')
      .waitForElementPresent('.modal-body__field', TIMEOUT, true, () => cb()),
    cb => browser
      .keys(NAME)
      .keys(browser.Keys.ENTER)
      .perform(() => cb()),
    // detect redirect to the namespaces detail page :-/
    cb => browser.waitForElementPresent('.co-m-nav-title__detail', TIMEOUT, true, () => cb()),
    cb => browser
      .assert.urlContains(`/namespaces/${NAME}`)
      .assert.containsText('#resource-title', NAME)
      .perform(() => cb()),
  ], seriesCB);
};

Object.keys(k8sObjs).forEach(resource => {
  namespacedResourcesTests[`${resource}`] = function (browser) {
    const crudPage = browser.page.crudPage();
    const kind = k8sObjs[resource];
    const series = [
      cb => navigate(browser, `/ns/${NAME}/${resource}?name=${NAME}`, cb),
      cb => onCreatedResource(NAME, resource, NAME, cb),
      cb => createExamples(crudPage, browser, cb),
      cb => navigate(browser, `/ns/${NAME}/search?kind=${kind}&q=${TEST_LABEL}%3d${NAME}`, cb),
      cb => loadStatusBox(browser, 0, cb),
      cb => browser
        // tab to filter box
        .keys(browser.Keys.TAB)
        // tab to fist item in list
        .keys(browser.Keys.TAB)
        // go to the details page...
        .keys(browser.Keys.ENTER)
        // Could use xpath instead...
        // .useXpath()
        // .click('//div[contains(@class, "loading-box__loaded")]//span[contains(@class, "co-resource-link")]/a[contains(@title, *)][1]')
        // .useCss()
        .waitForElementPresent('#resource-title', TIMEOUT, true, () => cb()),
      cb => {
        // Roles list page is composite (without applying filters)
        if (resource !== 'roles') {
          browser.assert.urlContains(`/${NAME}`);
          browser.assert.containsText('#resource-title', NAME);
        }
        navigate(browser, `/ns/${NAME}/${resource}?name=${NAME}`, cb);
      },
      cb => deleteExamples(crudPage, browser, cb),
      cb => onDeletedResource(NAME, resource, NAME, cb),
    ];
    async.series(series, seriesCB(browser));
  };
});

namespacedResourcesTests.deleteNamespace = browser => {
  console.log(`deleting namespace: ${NAME}`);
  const series = [
    cb => navigate(browser, `/namespaces/${NAME}`, cb),
    cb => browser.page.crudPage()
      .waitForElementPresent('@actionsDropdownButton', TIMEOUT)
      .click('@actionsDropdownButton')
      .waitForElementPresent('@actionsDropdownDeleteLink', TIMEOUT)
      .click('@actionsDropdownDeleteLink')
      .waitForElementPresent('@deleteModalConfirmButton', TIMEOUT, true, () => cb()),
    cb => browser
      .keys(NAME)
      .pause(200)
      .keys(browser.Keys.ENTER)
      .pause(1000)
      .perform(() => onDeletedResource(NAME, 'namespaces', undefined, cb)),
  ];
  async.series(series, seriesCB(browser));
};

namespacedResourcesTests.after = browser => {
  h1(`Leaked ${LEAKED_RESOURCES.size} resources out of ${RESOURCES_CREATED} (maybe)!`);

  new Array(...LEAKED_RESOURCES).forEach(resource => {
    const {name, namespace, plural} = JSON.parse(resource);
    if (namespace) {
      // These resources will be deleted when we delete the namespace itself...
      return;
    }

    let command = `kubectl delete ${plural} ${name}`;
    if (namespace) {
      command = `${command} -n ${namespace}`;
    }

    console.log(`running: ${command} ...`);

    try {
      // eslint-disable-next-line camelcase
      const stdout = child_process.execSync(command, {timeout: TIMEOUT});
      console.log(stdout.toString('utf-8'));
    } catch (e) {
      console.error(e.message);
      return;
    }
  });

  browser.getLog('browser', logs => {
    h1('BEGIN BROWSER LOGS');
    _.each(logs, log => {
      const { level, message } = log;
      const messageStr = _.isArray(message) ? message.join(' ') : message;

      switch (level) {
        case 'DEBUG':
          console.log(level, messageStr);
          break;
        case 'SEVERE':
          console.warn(level, messageStr);
          break;
        case 'INFO':
        default:
          // eslint-disable-next-line no-console
          console.info(level, messageStr);
      }
    });
    h1('END BROWSER LOGS');
  });

  browser.end();
};

module.exports = namespacedResourcesTests;
