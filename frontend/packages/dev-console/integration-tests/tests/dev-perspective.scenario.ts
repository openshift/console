import { browser } from 'protractor';
import {
  appHost,
  checkLogs,
  checkErrors,
} from '@console/internal-integration-tests/protractor.conf';
import {
  switchPerspective,
  Perspective,
  pageSidebar,
  sideHeader,
} from '../views/dev-perspective.view';

describe('Application Launcher Menu', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/k8s/cluster/projects`);
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('Switch from admin to dev perspective', async () => {
    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    expect(pageSidebar.getText()).toContain('Topology');
    expect(pageSidebar.getText()).toContain('+Add');
    expect(pageSidebar.getText()).toContain('Builds');
    expect(pageSidebar.getText()).toContain('Advanced');
    expect(pageSidebar.getText()).toContain('Project Details');
    expect(pageSidebar.getText()).toContain('Project Access');
    expect(pageSidebar.getText()).toContain('Events');
    expect(pageSidebar.getText()).toContain('Search');
  });

  it('Switch to dev to admin perspective', async () => {
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');
    expect(pageSidebar.getText()).toContain('Administration');
  });
});
