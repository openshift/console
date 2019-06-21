import { browser, $ } from "protractor";
import { appHost, checkLogs, checkErrors } from "../../protractor.conf";
import {
  switchPerspective,
  Perspective,
  devPerspective,
  adminPerspective,
} from "../../views/devconsole-view/mega-menu.view";

describe("Mega Menu", () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/dev/topology/ns/default`);
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  async function dev() {
    await switchPerspective(Perspective.Developer);
  }

  async function admin() {
    await switchPerspective(Perspective.Administrator);
  }

  var part = $('#page-sidebar .pf-c-nav .pf-c-nav__list');


  it("Switch to dev perspective", async () => {
    await admin();
    await switchPerspective(Perspective.Developer);
    expect(part.getText()).toContain('Topology');
    expect(devPerspective.getText()).toContain("Developer");
  });

  it("Switch to admin perspective", async () => {
    await dev();
    await switchPerspective(Perspective.Administrator);
    expect(part.getText()).toContain('Administration');
    expect(adminPerspective.getText()).toContain("Administrator");
  });

  it("Switch to multi-modal perspective", async () => {
    await switchPerspective(Perspective.MultiModalManager);
  });
});
