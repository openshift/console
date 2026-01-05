import { Set as ImmutableSet } from 'immutable';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';
import {
  DeploymentModel,
  StatefulSetModel,
  DeploymentConfigModel,
  DaemonSetModel,
} from '../../../../public/models';
import { checkErrors, testName } from '../../support';
import { detailsPage } from '../../views/details-page';
import { masthead } from '../../views/masthead';
import { overviewPage } from '../../views/overview';
import * as yamlEditor from '../../views/yaml-editor';

const overviewResources = ImmutableSet([
  DaemonSetModel,
  DeploymentModel,
  DeploymentConfigModel,
  StatefulSetModel,
]);

describe('Visiting Overview page', () => {
  before(() => {
    cy.login();
    cy.createProjectWithCLI(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  overviewResources.forEach((kindModel) => {
    describe(kindModel.labelPlural, () => {
      const resourceName = `${testName}-${kindModel.kind.toLowerCase()}`;

      before(() => {
        cy.visit(`k8s/ns/${testName}/${kindModel.plural}/~new`);
        masthead.username.shouldBeVisible();
        yamlEditor.isLoaded();
        yamlEditor.getEditorContent().then((content) => {
          const newContent = _.defaultsDeep(
            {},
            { metadata: { name: resourceName, labels: { automatedTestName: testName } } },
            safeLoad(content),
          );
          yamlEditor.setEditorContent(safeDump(newContent)).then(() => {
            yamlEditor.clickSaveCreateButton();
            cy.byTestID('yaml-error').should('not.exist');
            detailsPage.sectionHeaderShouldExist(`${kindModel.label} details`);
          });
        });
      });

      it(`displays a ${kindModel.id} in the overview list page`, () => {
        cy.visit(`/k8s/cluster/projects/${testName}/workloads?view=list`);
        overviewPage.projectOverviewShouldBeVisible();
        overviewPage.itemsShouldBeVisible();
        overviewPage.groupLabelItemContains(kindModel);
        overviewPage.projectOverviewListItemContains(resourceName);
      });

      it(`shows ${kindModel.id} details sidebar when item is clicked`, () => {
        cy.visit(`/k8s/cluster/projects/${testName}/workloads?view=list`);
        overviewPage.detailsSidebarShouldExist(false);
        overviewPage.clickProjectOverviewListItem(resourceName);
        overviewPage.detailsSidebarShouldExist(true);
        overviewPage.detailsSidebarHeadingContains(resourceName);
      });
    });
  });
});
