import { browser } from 'protractor';
import { appHost } from '../../protractor.conf';
import { execSync } from 'child_process';
import { logIn } from './utils/utils';

describe('Authentication', () => {
  it('Oc logs in.', async() => {
    execSync(`oc login -u ${process.env.BRIDGE_AUTH_USERNAME} -p ${process.env.BRIDGE_AUTH_PASSWORD} --config=${process.env.KUBECONFIG}`);
  });

  it('Web console logs in.', async() => {
    await browser.get(appHost);
    if (process.env.BRIDGE_BASE_ADDRESS !== undefined) {
      await logIn();
    }
  });
});
