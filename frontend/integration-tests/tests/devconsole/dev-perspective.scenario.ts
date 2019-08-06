import { browser, $ } from 'protractor';
import { appHost, checkLogs, checkErrors } from '../../protractor.conf';
import {
  switchPerspective,
  Perspective,
} from '../../views/devconsole-view/dev-perspective.view';

export const pageSidebar = $('#page-sidebar .pf-c-nav .pf-c-nav__list');
export const sideHeader = $('#page-sidebar .oc-nav-header h1');

describe('Application Launcher Menu', () => {
  
  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/cluster/projects`);
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('Switch from admin to dev perspective', async() => {
    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    expect(pageSidebar.getText()).toContain('Topology');
  });

  it('Switch to dev to admin perspective', async() => {
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');
    expect(pageSidebar.getText()).toContain('Administration');
  });

});
