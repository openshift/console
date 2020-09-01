import { browser, $ } from 'protractor';
import { execSync } from 'child_process';
import * as HtmlScreenshotReporter from 'protractor-jasmine2-screenshot-reporter';
import * as _ from 'lodash';
import { TapReporter, JUnitXmlReporter } from 'jasmine-reporters';
import * as ConsoleReporter from 'jasmine-console-reporter';
import * as failFast from 'protractor-fail-fast';
import { createWriteStream, writeFileSync } from 'fs';
import { format } from 'util';
import {
  resolvePluginPackages,
  reducePluginTestSuites,
  mergeTestSuites,
} from '@console/plugin-sdk/src/codegen';

const tap = !!process.env.TAP;

export const BROWSER_NAME = process.env.BRIDGE_E2E_BROWSER_NAME || 'chrome';
export const BROWSER_TIMEOUT = 15000;
export const JASMSPEC_TIMEOUT = process.env.BRIDGE_JASMINE_TIMEOUT
  ? Number(process.env.BRIDGE_JASMINE_TIMEOUT)
  : 120000;
export const appHost = `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000'}${(
  process.env.BRIDGE_BASE_PATH || '/'
).replace(/\/$/, '')}`;
export const testName = `test-${Math.random()
  .toString(36)
  .replace(/[^a-z]+/g, '')
  .substr(0, 5)}`;
export const screenshotsDir = 'gui_test_screenshots';

const htmlReporter = new HtmlScreenshotReporter({
  dest: `./${screenshotsDir}`,
  inlineImages: true,
  captureOnlyFailedSpecs: true,
  filename: 'protractor-report.html',
});
const junitReporter = new JUnitXmlReporter({
  savePath: `./${screenshotsDir}`,
  filePrefix: 'junit_protractor',
  consolidateAll: true,
});
const browserLogs = [];

const suite = (tests: string[]): string[] =>
  (!_.isNil(process.env.BRIDGE_KUBEADMIN_PASSWORD) ? ['tests/login.scenario.ts'] : []).concat([
    // 'tests/base.scenario.ts',
    ...tests,
  ]);

// TODO(vojtech): move base Console test suites to console-app package
const testSuites = {
  filter: suite(['tests/filter.scenario.ts']),
  annotation: suite(['tests/modal-annotations.scenario.ts']),
  environment: suite(['tests/environment.scenario.ts']),
  secrets: suite(['tests/secrets.scenario.ts']),
  storage: suite(['tests/storage.scenario.ts']),
  crud: suite([
    'tests/crud.scenario.ts',
    'tests/secrets.scenario.ts',
    'tests/filter.scenario.ts',
    'tests/modal-annotations.scenario.ts',
    'tests/environment.scenario.ts',
  ]),
  event: suite(['tests/event.scenario.ts']),
  crudBasic: suite(['tests/crud.scenario.ts']),
  monitoring: suite(['tests/monitoring.scenario.ts']),
  newApp: suite(['tests/overview/overview.scenario.ts', 'tests/deploy-image.scenario.ts']),
  olmFull: suite([
    '../packages/operator-lifecycle-manager/integration-tests/scenarios/descriptors.scenario.ts',
    '../packages/operator-lifecycle-manager/integration-tests/scenarios/operator-hub.scenario.ts',
    '../packages/operator-lifecycle-manager/integration-tests/scenarios/global-installmode.scenario.ts',
    '../packages/operator-lifecycle-manager/integration-tests/scenarios/single-installmode.scenario.ts',
  ]),
  performance: suite(['tests/performance.scenario.ts']),
  serviceCatalog: suite([
    'tests/service-catalog/service-catalog.scenario.ts',
    'tests/service-catalog/service-broker.scenario.ts',
    'tests/service-catalog/service-class.scenario.ts',
    'tests/service-catalog/service-binding.scenario.ts',
    'tests/developer-catalog.scenario.ts',
  ]),
  overview: suite(['tests/overview/overview.scenario.ts']),
  crdExtensions: suite(['tests/crd-extensions.scenario.ts']),
  oauth: suite(['tests/oauth.scenario.ts']),
  e2e: suite([
    'tests/crud.scenario.ts',
    'tests/filter.scenario.ts',
    'tests/secrets.scenario.ts',
    'tests/storage.scenario.ts',
    'tests/modal-annotations.scenario.ts',
    'tests/environment.scenario.ts',
    'tests/overview/overview.scenario.ts',
    'tests/deploy-image.scenario.ts',
    'tests/performance.scenario.ts',
    'tests/monitoring.scenario.ts',
    'tests/alertmanager.scenario.ts',
    'tests/crd-extensions.scenario.ts',
    'tests/oauth.scenario.ts',
    'tests/devconsole/pipeline.scenario.ts',
    'tests/dashboards/cluster-dashboard.scenario.ts',
    'tests/dashboards/project-dashboard.scenario.ts',
    'tests/event.scenario.ts',
    'tests/cluster-settings.scenario.ts',
  ]),
  release: suite([
    'tests/crud.scenario.ts',
    'tests/secrets.scenario.ts',
    'tests/filter.scenario.ts',
    'tests/environment.scenario.ts',
    'tests/overview/overview.scenario.ts',
    'tests/deploy-image.scenario.ts',
    'tests/performance.scenario.ts',
    'tests/monitoring.scenario.ts',
    'tests/crd-extensions.scenario.ts',
    'tests/dashboards/cluster-dashboard.scenario.ts',
    'tests/dashboards/project-dashboard.scenario.ts',
    'tests/event.scenario.ts',
  ]),
  all: suite([
    'tests/crud.scenario.ts',
    'tests/overview/overview.scenario.ts',
    'tests/secrets.scenario.ts',
    'tests/storage.scenario.ts',
    'tests/olm/**/*.scenario.ts',
    'tests/service-catalog/**/*.scenario.ts',
    'tests/filter.scenario.ts',
    'tests/modal-annotations.scenario.ts',
    'tests/deploy-image.scenario.ts',
    'tests/developer-catalog.scenario.ts',
    'tests/monitoring.scenario.ts',
    'tests/alertmanager.scenario.ts',
    'tests/devconsole/dev-perspective.scenario.ts',
    'tests/devconsole/git-import-flow.scenario.ts',
    'tests/devconsole/pipeline.scenario.ts',
    'tests/crd-extensions.scenario.ts',
    'tests/oauth.scenario.ts',
    'tests/dashboards/cluster-dashboard.scenario.ts',
    'tests/dashboards/project-dashboard.scenario.ts',
    'tests/event.scenario.ts',
    'tests/cluster-settings.scenario.ts',
  ]),
  clusterSettings: suite(['tests/cluster-settings.scenario.ts']),
  alertmanager: suite(['tests/alertmanager.scenario.ts']),
  login: ['tests/login.scenario.ts'],
  dashboards: suite([
    'tests/dashboards/cluster-dashboard.scenario.ts',
    'tests/dashboards/project-dashboard.scenario.ts',
  ]),
};

export const config = {
  framework: 'jasmine',
  directConnect: true,
  skipSourceMapSupport: true,
  jasmineNodeOpts: {
    print: () => null,
    defaultTimeoutInterval: JASMSPEC_TIMEOUT,
  },
  logLevel: tap ? 'ERROR' : 'INFO',
  plugins: process.env.NO_FAILFAST ? [] : [failFast.init()],
  capabilities: {
    browserName: BROWSER_NAME,
    acceptInsecureCerts: true,
    chromeOptions: {
      // A path to chrome binary, if undefined will use system chrome browser.
      binary: process.env.CHROME_BINARY_PATH,
      args: [
        ...(process.env.NO_HEADLESS ? [] : ['--headless']),
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=1920,1200',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-raf-throttling',
        // Avoid crashes when running in a container due to small /dev/shm size
        // https://bugs.chromium.org/p/chromium/issues/detail?id=715363
        '--disable-dev-shm-usage',
      ],
      prefs: {
        // eslint-disable-next-line camelcase
        'profile.password_manager_enabled': false,
        // eslint-disable-next-line camelcase
        credentials_enable_service: false,
        // eslint-disable-next-line camelcase
        password_manager_enabled: false,
      },
    },
    'moz:firefoxOptions': {
      binary: process.env.FIREFOX_BINARY_PATH,
      args: [
        ...(process.env.NO_HEADLESS ? [] : ['--headless']),
        '--safe-mode',
        '--width=1920',
        '--height=1200',
        '--MOZ_LOG=timestamp,nsHttp:0,sync',
        `--MOZ_LOG_FILE=${screenshotsDir}/browser`,
      ],
      log: { level: 'trace' },
    },
  },
  beforeLaunch: () => new Promise((resolve) => htmlReporter.beforeLaunch(resolve)),
  onPrepare: () => {
    const addReporter = (jasmine as any).getEnv().addReporter;
    browser.waitForAngularEnabled(false);
    addReporter(htmlReporter);
    addReporter(junitReporter);
    if (tap) {
      addReporter(new TapReporter());
    } else {
      addReporter(new ConsoleReporter());
    }
  },
  onComplete: async () => {
    const consoleLogStream = createWriteStream(`${screenshotsDir}/browser.log`, { flags: 'a' });
    browserLogs.forEach((log) => {
      const { level, message } = log;
      const messageStr = _.isArray(message) ? message.join(' ') : message;
      consoleLogStream.write(`${format.apply(null, [`[${level.name}]`, messageStr])}\n`);
    });

    const url = await browser.getCurrentUrl();
    console.log('Last browser URL: ', url);

    // Use projects if OpenShift so non-admin users can run tests. We need the fully-qualified name
    // since we're using kubectl instead of oc.
    const resource =
      browser.params.openshift === 'true' ? 'projects.project.openshift.io' : 'namespaces';
    await browser.close();
    execSync(
      `if kubectl get ${resource} ${testName} 2> /dev/null; then kubectl delete ${resource} ${testName}; fi`,
    );
  },
  afterLaunch: (exitCode) => {
    failFast.clean();
    return new Promise((resolve) => htmlReporter.afterLaunch(resolve.bind(this, exitCode)));
  },
  suites: mergeTestSuites(
    testSuites,
    reducePluginTestSuites(resolvePluginPackages(), __dirname, suite),
  ),
  params: {
    // Set to 'true' to enable OpenShift resources in the crud scenario.
    // Use a string rather than boolean so it can be specified on the command line:
    // $ yarn run test-gui --params.openshift true
    openshift: 'false',
    // Set to 'true' to enable Service Catalog resources in the crud scenario.
    servicecatalog: 'false',
  },
};

export const checkLogs = async () => {
  if (config.capabilities.browserName !== 'chrome') {
    return;
  }
  (
    await browser
      .manage()
      .logs()
      .get('browser')
  ).map((log) => {
    browserLogs.push(log);
    return log;
  });
};

function hasError() {
  return window.windowError;
}
export const checkErrors = async () =>
  await browser.executeScript(hasError).then((err) => {
    if (err) {
      fail(`omg js error: ${err}`);
    }
  });

export const firstElementByTestID = (id: string) => $(`[data-test-id=${id}]`);

export const waitForCount = (elementArrayFinder, expectedCount) => {
  return async () => {
    const actualCount = await elementArrayFinder.count();
    return expectedCount >= actualCount;
  };
};

export const waitForNone = (elementArrayFinder) => {
  return async () => {
    const count = await elementArrayFinder.count();
    return count === 0;
  };
};

export const create = (obj) => {
  const filename = [screenshotsDir, `${obj.metadata.name}.${obj.kind.toLowerCase()}.json`].join(
    '/',
  );
  writeFileSync(filename, JSON.stringify(obj));
  execSync(`kubectl create -f ${filename}`);
  execSync(`rm ${filename}`);
};

// Retry an action to avoid StaleElementReferenceErrors.
export const retry = async <T>(fn: () => Promise<T>, retries = 3, interval = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if (!retries) {
      throw e;
    }
    await new Promise((r) => setTimeout(r, interval));
    return retry(fn, retries - 1, interval * 2);
  }
};
