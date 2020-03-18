import { browser, $, element, by, ExpectedConditions as until } from 'protractor';
import { appHost, checkLogs, checkErrors, testName } from '../protractor.conf';
import { execSync } from 'child_process';

describe('Events', () => {
  const name = `${testName}-event-test-pod`;
  const testpod = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name,
      namespace: testName,
    },
    spec: {
      containers: [
        {
          name: 'hello-openshift',
          image: 'openshift/hello-openshift',
        },
      ],
    },
  };
  beforeAll(() => {
    execSync(`echo '${JSON.stringify(testpod)}' | kubectl create -n ${testName} -f -`);
  });
  afterEach(() => {
    checkLogs();
    checkErrors();
  });
  afterAll(() => {
    try {
      execSync(`kubectl delete pods ${name} -n ${testName}`);
    } catch (error) {
      console.error(`\nFailed to delete pods ${name}:\n${error}`);
    }
  });
  describe('Events', () => {
    it('event view displays created pod', async () => {
      await browser.get(`${appHost}/ns/${testName}/events`);
      await browser.wait(until.presenceOf(element(by.linkText(name))));
      await browser.wait(until.presenceOf($(`[data-test-id=${name}]`)));
      expect($(`[data-test-id=${name}]`).getText()).toEqual(name);
    });
  });
});
