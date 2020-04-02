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
import { PINNED_RESOURCES_LOCAL_STORAGE_KEY } from '@console/shared/src';

describe('Application Launcher Menu', () => {
  beforeAll(async () => {
    localStorage.setItem(
      PINNED_RESOURCES_LOCAL_STORAGE_KEY,
      JSON.stringify({ dev: ['apps~v1~StatefulSet'] }),
    );
    await browser.get(`${appHost}/k8s/cluster/projects`);
  });

  afterEach(() => {
    localStorage.removeItem(PINNED_RESOURCES_LOCAL_STORAGE_KEY);
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
    expect(pageSidebar.getText()).toContain('More');
    expect(pageSidebar.getText()).toContain('Project Details');
    expect(pageSidebar.getText()).toContain('Project Access');
    expect(pageSidebar.getText()).toContain('Search');
    expect(pageSidebar.getText()).toContain('Stateful Sets');
  });

  it('Switch to dev to admin perspective', async () => {
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');
    expect(pageSidebar.getText()).toContain('Administration');
  });
});
