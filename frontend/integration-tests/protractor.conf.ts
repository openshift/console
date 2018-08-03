/* eslint-disable no-undef, no-unused-vars */

import { Config, browser, logging } from 'protractor';
import { execSync } from 'child_process';
import * as HtmlScreenshotReporter from 'protractor-jasmine2-screenshot-reporter';
import * as _ from 'lodash';
import { TapReporter } from 'jasmine-reporters';
import * as ConsoleReporter from 'jasmine-console-reporter';
import * as failFast from 'protractor-fail-fast';

let tap = !!process.env.TAP;

if (tap) {
  // FIXME: Remove once https://github.com/angular/protractor/pull/4068 is merged
  require('protractor/built/logger').Logger.setWrite(3); // Disable all logging for TAP mode (otherwise output isn't valid TAP)
}

export const appHost = `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000'}${(process.env.BRIDGE_BASE_PATH || '/').replace(/\/$/, '')}`;
export const testName = `test-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)}`;

const htmlReporter = new HtmlScreenshotReporter({dest: './gui_test_screenshots', inlineImages: true, captureOnlyFailedSpecs: true, filename: 'test-gui-report.html'});
const browserLogs: logging.Entry[] = [];

export const config: Config = {
  framework: 'jasmine',
  directConnect: true,
  skipSourceMapSupport: true,
  jasmineNodeOpts: {
    print: () => null,
    defaultTimeoutInterval: 40000,
  },
  plugins: [failFast.init()],
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: [
        '--disable-gpu',
        '--headless',
        '--no-sandbox',
        '--window-size=1920,1200',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-raf-throttling'
      ],
      prefs: {
        'profile.password_manager_enabled': false,
        'credentials_enable_service': false,
        'password_manager_enabled': false
      }
    }
  },
  beforeLaunch: () => new Promise(resolve => htmlReporter.beforeLaunch(resolve)),
  onPrepare: () => {
    browser.waitForAngularEnabled(false);
    jasmine.getEnv().addReporter(htmlReporter);
    if (tap) {
      jasmine.getEnv().addReporter(new TapReporter());
    } else {
      jasmine.getEnv().addReporter(new ConsoleReporter());
    }
  },
  onComplete: async() => {
    console.log('BEGIN BROWSER LOGS');
    browserLogs.forEach(log => {
      const {level, message} = log;
      const messageStr = _.isArray(message) ? message.join(' ') : message;
      switch (level.name) {
        case 'DEBUG':
          console.log(level, messageStr);
          break;
        case 'SEVERE':
          console.warn(level, messageStr);
          break;
        case 'INFO':
        default:
          console.info(level, messageStr);
      }
    });
    console.log('END BROWSER LOGS');

    await browser.close();
    execSync(`kubectl delete --cascade ns ${testName}`);
  },
  afterLaunch: (exitCode) => {
    failFast.clean();
    return new Promise(resolve => htmlReporter.afterLaunch(resolve.bind(this, exitCode)));
  },
  suites: {
    filter: ['tests/base.scenario.ts', 'tests/filter.scenario.ts'],
    crud: ['tests/base.scenario.ts', 'tests/crud.scenario.ts', 'tests/filter.scenario.ts', 'tests/modal-annotations.scenario.ts', 'tests/environment.scenario.ts'],
    olm: ['tests/base.scenario.ts', 'tests/olm/catalog.scenario.ts', 'tests/olm/etcd.scenario.ts', 'tests/olm/prometheus.scenario.ts'],
    olmUpgrade: ['tests/base.scenario.ts', 'tests/olm/update-channel-approval.scenario.ts'],
    performance: ['tests/base.scenario.ts', 'tests/performance.scenario.ts'],
    all: ['tests/base.scenario.ts', 'tests/crud.scenario.ts', 'tests/olm/**/*.scenario.ts', 'tests/filter.scenario.ts', 'tests/modal-annotations.scenario.ts'],
  },
  params: {
    // Set to 'true' to enable OpenShift resources in the crud scenario.
    // Use a string rather than boolean so it can be specified on the command line:
    // $ yarn run test-gui --params.openshift true
    openshift: 'false'
  }
};

export const checkLogs = async() => (await browser.manage().logs().get('browser'))
  .map(log => {
    browserLogs.push(log);
    return log;
  });

function hasError () {
  return (window as any).windowError;
}
export const checkErrors = async() => await browser.executeScript(hasError).then(err => {
  if (err) {
    fail(`omg js error: ${err}`);
  }
});
