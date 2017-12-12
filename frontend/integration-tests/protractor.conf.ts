/* eslint-disable no-undef, no-unused-vars */

import { Config, browser } from 'protractor';
import * as request from 'request';
import * as HtmlScreenshotReporter from 'protractor-jasmine2-screenshot-reporter';
import * as _ from 'lodash';

const {BRIDGE_BASE_PATH, BRIDGE_BASE_ADDRESS} = process.env;

export const appHost: string = BRIDGE_BASE_PATH && BRIDGE_BASE_ADDRESS ? `${BRIDGE_BASE_ADDRESS}${BRIDGE_BASE_PATH}` : _.get(browser, 'launch_url', 'http://localhost:9000');
export const almDeploymentEndpoint = `${appHost}/api/kubernetes/apis/apps/v1beta2/namespaces/tectonic-system/deployments/alm-operator`;

const reporter = new HtmlScreenshotReporter({
  dest: './tests_output/alm-e2e',
  inlineImages: true,
  captureOnlyFailedSpecs: true,
  filename: 'alm-e2e-report.html',
});

export const config: Config = {
  framework: 'jasmine',
  directConnect: true,
  skipSourceMapSupport: true,
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: [
        '--disable-infobars',
        '--disable-gpu',
        '--headless',
        '--no-sandbox',
        '--window-size=1400,1050',
      ],
      prefs: {
        'profile.password_manager_enabled': false,
        'credentials_enable_service': false,
        'password_manager_enabled': false
      }
    }
  },
  beforeLaunch: () => new Promise(resolve => reporter.beforeLaunch(resolve)),
  onPrepare: () => {
    browser.driver.manage().window().maximize();
    browser.waitForAngularEnabled(false);
    (jasmine as any).getEnv().addReporter(reporter);

    return new Promise((resolve, reject) => {
      request(almDeploymentEndpoint, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          console.log(`ALM Operator Deployment found at ${almDeploymentEndpoint}`);
          resolve();
        } else {
          reject(`No ALM Operator Deployment found at ${appHost}`);
        }
      });
    });
  },
  onComplete: () => browser.close(),
  afterLaunch: (exitCode) => new Promise(resolve => reporter.afterLaunch(resolve.bind(this, exitCode))),
  specs: [
    // './tests/**/*.scenario.ts',
    './tests/crud.scenario.ts',
  ],
};
