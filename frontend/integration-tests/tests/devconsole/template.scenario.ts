/*
This template provides a starting point for the development of UI tests for
the OpenShift Console. The template is a fully functioning test that can be
extended in feature-specific tests.

Test conventions:
The use of browser.sleep() and xpath-base statements are discouraged in
automated tests. It should be possible to have the browser wait for the
presence of UI statements to wait for the presence of UI elements. It should
also be possible tgo locate UI elements though css, id's, or data-test-id's.
*/

/* Import required libraries */
import { browser } from 'protractor';
import { appHost, checkLogs, checkErrors } from '../../protractor.conf';
import {
  switchPerspective,
  Perspective,
  sideHeader,
} from '../../views/devconsole-view/dev-perspective.view';

/* Provide details on the goals of the test */
describe('details what are you doing', () => {

/* The beforeAll function is performed once, before all other actions are performed */
  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/cluster/projects`);
  });

/* The beforeEach function is performed before each test function */
  beforeEach(async() => {
  });

/* The afterEach function is performed after each test function - at a minimum,
it should check for errors and logs */
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

/* The afterEverything function is performed after all tests */
  afterAll(async() => {
  });

  /* A sample test function - Note that the test functions use functions and elements
  from the respctive view files */
  it('Task details are provided here', async() => {

    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');

  });

});
