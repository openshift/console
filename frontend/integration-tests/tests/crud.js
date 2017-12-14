// eslint-disable-next-line camelcase
const child_process = require('child_process');

const _ = require('lodash');
const async = require('async');
const { safeLoad, safeDump } = require('js-yaml');

const TIMEOUT = parseInt(process.env.TIMEOUT, 10) || 15000;
const TEST_LABEL = 'automatedTestName';

const checkForErrors = (browser, cb) => {
  browser.execute(function () {
    return {
      windowErrors: window.windowErrors || [],
      windowError: window.windowError,
    };
  }, result => {
    const {windowError, windowErrors} = result.value;
    browser.assert.notEqual(windowError, true, 'No unhandled JavaScript errors.');
    browser.assert.equal(windowErrors.length, 0, 'No unhandled JavaScript errors.');
    if (windowErrors.length) {
      console.error('Unhandled JavaScript errors:');
      _.each(windowErrors, e => console.log(e));
    }
    cb();
  });
};

const navigate = ({browser, path, wait=0}, navCB) => {
  async.series([
    // Check for existing errors before navigating away
    cb => checkForErrors(browser, cb),
    cb => {
      let url;

      let {BRIDGE_BASE_PATH, BRIDGE_BASE_ADDRESS} = process.env;
      if (BRIDGE_BASE_PATH && BRIDGE_BASE_ADDRESS) {
        // Paths start with /, so avoid // in urls.
        if (BRIDGE_BASE_PATH.slice(-1) === '/') {
          BRIDGE_BASE_PATH = BRIDGE_BASE_PATH.slice(0, -1);
        }
        url = `${BRIDGE_BASE_ADDRESS}${BRIDGE_BASE_PATH}${path}`;
      } else {
        url = browser.launch_url + path;
      }
      browser.url(url, ({error, value}) => {
        console.log('navigated to', url);
        cb(error, value);
      });
    },
    // Check for unhandled js errors
    cb => browser.execute(function () {
      if (window.windowErrors) {
        console.warn('windowErrors already exists');
        return;
      }
      // Error handlers in app.jsx check for windowErrors & append if it exists.
      window.windowErrors = [];
    }, ({status}) => cb(status)),
    cb => {
      // TODO (ggreer): wait for some element to be visible instead of sitting on the page for x seconds
      wait && browser.pause(wait);
      cb();
    }
  ], navCB);
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
      return Array.from(document.querySelectorAll('div.co-m-cog-wrapper--enabled')).map(d => d.getAttribute('id'));
    }, ({value}) => deleteExample(value));
  });
};


const updateYamlEditor = (browser, override, addLabels, cb) => {
  browser.execute(function () {
    return window.ace.getValue();
  }, ({value}) => {
    const defaultExtends = {metadata: {name: NAME}};
    if (addLabels) {
      defaultExtends.metadata.labels = {automatedTest: 'yes', [TEST_LABEL]: NAME};
    }
    const json = _.defaultsDeep({}, override, defaultExtends, safeLoad(value));
    const yaml = safeDump(json);
    browser.execute(function (text) {
      return window.ace.setValue(text);
    }, [yaml], result => {
      browser.assert.equal(result.status, 0, 'Updated name and label via ace.');
      cb();
    });
  });
};

const createYAML = ({browser, override, addLabels=true}, createCB) => {
  const crudPage = browser.page.crudPage();

  async.series([
    cb => crudPage
      .waitForElementPresent('@CreateYAMLButton', TIMEOUT)
      .click('@CreateYAMLButton')
      .waitForElementPresent('@saveYAMLButton', TIMEOUT, true, () =>cb()),
    cb => updateYamlEditor(browser, override, addLabels, cb),
    cb => crudPage
      .click('@saveYAMLButton')
      .waitForElementPresent('@actionsDropdownButton', TIMEOUT, true, () => cb()),
    cb => {
      const name = _.get(override, 'metadata.name', NAME);
      browser.verify.urlContains(`/${name}`);
      cb();
    },
  ], createCB);
};

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

const TESTS = {};

const login = (browser, cb) => {
  const {BRIDGE_AUTH_USERNAME, BRIDGE_AUTH_PASSWORD, BRIDGE_BASE_ADDRESS} = process.env;
  if (!BRIDGE_AUTH_USERNAME || !BRIDGE_AUTH_PASSWORD) {
    return cb();
  }
  browser.waitForElementPresent('input[name=login]', TIMEOUT)
    .setValue('input[name=login]', BRIDGE_AUTH_USERNAME)
    .setValue('input[name=password]', BRIDGE_AUTH_PASSWORD)
    .submitForm('form')
    // TODO: replace with #tectonic-start-guide
    .useXpath()
    .waitForElementPresent('//h3[contains(text(), "Tectonic Quick Start Guide")]', TIMEOUT)
    .useCss()
    .perform(() => {
      console.log(`Logged in to ${BRIDGE_BASE_ADDRESS} as ${BRIDGE_AUTH_USERNAME}!`);
      cb();
    });
};

TESTS.before = browser => {
  console.log(`creating namespace ${NAME}`);

  async.series([
    cb => navigate({browser, path: ''}, cb),
    cb => login(browser, cb),
    cb => navigate({browser, path: '/namespaces'}, cb),
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
    cb => checkForErrors(browser, cb),
  ], seriesCB(browser));
};

TESTS.afterEach = (browser, done) => checkForErrors(browser, done);

TESTS.CRDs = browser => {
  const plural = `crd${NAME}s`;
  const group = 'test.example.com';
  const name = `${plural}.${group}`;
  async.auto({
    load: cb => navigate({browser, path: '/crds'}, cb),
    gc: ['load', (res, cb) => onCreatedResource(name, 'customresourcedefinitions', undefined, cb)],
    create: ['gc', (res, cb) => {
      const override = {
        metadata: {
          name,
        },
        spec: {
          group,
          version: 'v1',
          names: {
            plural,
            singular: `crd${NAME}`,
            kind: `CRD${NAME}`,
            shortNames: [NAME],
          }
        }
      };
      createYAML({browser, override, addLabels: false}, cb);
    }],
    navigate: ['create', (res, cb) => navigate({browser, path: `/crds?name=${name}`}, cb)],
    list: ['navigate', (res, cb) => loadStatusBox(browser, 0, error => {
      if (error) {
        return cb(error);
      }

      browser.execute(function () {
        return Array.from(document.querySelectorAll('div.co-m-cog-wrapper--enabled')).map(d => d.getAttribute('id'));
      }, ({value}) => cb(null, value));
    })],
    edit: ['list', ({list: ids}, cb) => {
      const selector = `#${ids[0]}`;
      const css = `${selector} li:nth-child(3) a`;
      browser.pause(100)
        .click(selector)
        .waitForElementPresent(css, TIMEOUT)
        .click(css)
        .waitForElementPresent('.yaml-editor', TIMEOUT, true, () => cb());
    }],
    checkTitle: ['edit', (res, cb) => {
      browser.assert.containsText('#resource-title', name);
      cb();
    }],
  }, seriesCB(browser));
};

Object.keys(k8sObjs).forEach(resource => {
  TESTS[`${resource}`] = function (browser) {
    const crudPage = browser.page.crudPage();
    const kind = k8sObjs[resource];
    const series = [
      cb => navigate({browser, path: `/ns/${NAME}/${resource}?name=${NAME}`}, cb),
      cb => onCreatedResource(NAME, resource, NAME, cb),
      cb => createYAML({crudPage, browser}, cb),
      cb => navigate({browser, path: `/ns/${NAME}/search?kind=${kind}&q=${TEST_LABEL}%3d${NAME}`}, cb),
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
        .waitForElementPresent('.co-m-vert-nav__menu-item.co-m-vert-nav-item--active', TIMEOUT, true, () => cb()),
      cb => {
        browser.assert.elementNotPresent('.loading-box__errored', `Error loading ${resource} details page`);
        // Roles list page is composite (without applying filters)
        if (resource !== 'roles') {
          browser.assert.urlContains(`/${NAME}`);
          browser.assert.containsText('#resource-title', NAME);
        }
        navigate({browser, path: `/ns/${NAME}/${resource}?name=${NAME}`}, cb);
      },
      cb => deleteExamples(crudPage, browser, cb),
      cb => onDeletedResource(NAME, resource, NAME, cb),
    ];
    async.series(series, seriesCB(browser));
  };
});

TESTS.EditLabels = browser => {
  const resourceName = `${NAME}-editlabels`;
  const resourceType = 'configmaps';

  const labelValue = 'appblah';
  const series = [
    cb => navigate({browser, path: `/ns/${NAME}/${resourceType}`}, cb),
    cb => onCreatedResource(NAME, resourceType, resourceName, cb),
    cb => createYAML({browser, addLabels: false, override: {metadata: {name: resourceName, namespace: NAME}}}, cb),
    cb => browser.page.crudPage()
      .waitForElementPresent('@actionsDropdownButton', TIMEOUT)
      .click('@actionsDropdownButton')
      .waitForElementPresent('@actionsDropdownModifyLabelsLink', TIMEOUT)
      .click('@actionsDropdownModifyLabelsLink')
      .waitForElementPresent('@deleteModalConfirmButton', TIMEOUT, true, () => {
        browser
          .keys(labelValue)
          .pause(500)
          .perform(() => cb())
        ;
      }),
    cb => browser.page.crudPage()
      .click('@deleteModalConfirmButton')
      .waitForElementNotPresent('@deleteModalConfirmButton', TIMEOUT)
      .waitForElementPresent('.co-m-label .co-m-label__key', TIMEOUT, true, () => {
        browser.assert.containsText('.co-m-label .co-m-label__key', labelValue);
        cb();
      }),
    cb => deleteExamples(browser.page.crudPage(), browser, cb),
    cb => onDeletedResource(NAME, resourceType, resourceName, cb),
  ];
  async.series(series, seriesCB(browser));
};

TESTS.deleteNamespace = browser => {
  console.log(`deleting namespace: ${NAME}`);
  const series = [
    cb => navigate({browser, path: `/namespaces/${NAME}`}, cb),
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

[
  '/clusterroles/view',
  '/nodes',
  '/settings/cluster',
  '/all-namespaces/events',
  '/crds',
  '/',
  '/k8s/all-namespaces/alertmanagers',
  '/ns/tectonic-system/alertmanagers/main',
].forEach(url => TESTS[url] = browser =>
  navigate({browser, path: url, wait: 5000}, () => console.log(`visited ${url}`))
);

TESTS.after = browser => {
  h1(`Leaked ${LEAKED_RESOURCES.size} resources out of ${RESOURCES_CREATED} (maybe)!`);

  const failed = [];
  new Array(...LEAKED_RESOURCES).forEach(resource => {
    const {name, namespace, plural} = JSON.parse(resource);
    if (namespace) {
      // These resources will be deleted when we delete the namespace itself...
      return;
    }

    let command = `kubectl delete --cascade ${plural} ${name}`;
    if (namespace) {
      command = `${command} -n ${namespace}`;
    }

    console.log(`running: ${command} ...`);

    try {
      // eslint-disable-next-line camelcase
      const stdout = child_process.execSync(command, {timeout: TIMEOUT});
      console.log(stdout.toString('utf-8'));
    } catch (e) {
      console.error(`error running "${command}": `, e.message);
      // NotFound means we don't care
      if (e.message.indexOf('NotFound') < 0) {
        failed.push({command, error: e});
      }
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


  if (failed.length > 0) {
    console.error('Failed to clean up leaked resources!');
    _.each(failed, f => {
      console.error(`cmd: "${f.command}"`);
      console.error('err: ', f.error.message);
    });
    process.exit(1);
  }

  browser.end();
};

module.exports = TESTS;
