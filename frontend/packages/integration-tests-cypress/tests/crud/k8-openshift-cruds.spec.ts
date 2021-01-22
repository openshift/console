import { OrderedMap } from 'immutable';
import { safeLoad, safeDump } from 'js-yaml';
import * as _ from 'lodash';

import { testName, editKind, deleteKind, checkErrors } from '../../support';
import { listPage, ListPageSelector } from '../../views/list-page';
import { detailsPage, DetailsPageSelector } from '../../views/details-page';
import { projectDropdown } from '../../views/common';
import { modal } from '../../views/modal';
import * as yamlEditor from '../../views/yaml-editor';
import { errorMessage } from '../../views/form';

describe('Kubernetes resource CRUD operations', () => {
  before(() => {
    cy.login();
    cy.createProject(testName);
  });

  afterEach(() => {
    checkErrors();
  });

  after(() => {
    cy.deleteProject(testName);
    cy.logout();
  });

  const k8sObjs = OrderedMap<
    string,
    { kind: string; namespaced?: boolean; humanizeKind?: boolean; testI18n?: boolean }
  >()
    .set('pods', { kind: 'Pod' })
    .set('services', { kind: 'Service' })
    .set('serviceaccounts', { kind: 'ServiceAccount', testI18n: false })
    .set('secrets', { kind: 'Secret' })
    .set('configmaps', { kind: 'ConfigMap' })
    .set('persistentvolumes', { kind: 'PersistentVolume', namespaced: false, testI18n: false })
    .set('storageclasses', { kind: 'StorageClass', namespaced: false, testI18n: false })
    .set('ingresses', { kind: 'Ingress' })
    .set('cronjobs', { kind: 'CronJob' })
    .set('jobs', { kind: 'Job' })
    .set('daemonsets', { kind: 'DaemonSet' })
    .set('deployments', { kind: 'Deployment' })
    .set('replicasets', { kind: 'ReplicaSet' })
    .set('replicationcontrollers', { kind: 'ReplicationController' })
    .set('persistentvolumeclaims', { kind: 'PersistentVolumeClaim', testI18n: false })
    .set('statefulsets', { kind: 'StatefulSet' })
    .set('resourcequotas', { kind: 'ResourceQuota', humanizeKind: false })
    .set('limitranges', { kind: 'LimitRange', humanizeKind: false })
    .set('horizontalpodautoscalers', { kind: 'HorizontalPodAutoscaler' })
    .set('networkpolicies', { kind: 'NetworkPolicy' })
    .set('roles', { kind: 'Role', testI18n: false })
    .set('snapshot.storage.k8s.io~v1beta1~VolumeSnapshot', {
      kind: 'snapshot.storage.k8s.io~v1beta1~VolumeSnapshot',
      testI18n: false,
    })
    .set('snapshot.storage.k8s.io~v1beta1~VolumeSnapshotClass', {
      kind: 'snapshot.storage.k8s.io~v1beta1~VolumeSnapshotClass',
      namespaced: false,
      testI18n: false,
    })
    .set('snapshot.storage.k8s.io~v1beta1~VolumeSnapshotContent', {
      kind: 'snapshot.storage.k8s.io~v1beta1~VolumeSnapshotContent',
      namespaced: false,
      testI18n: false,
    });
  const openshiftObjs = OrderedMap<
    string,
    { kind: string; namespaced?: boolean; testI18n?: boolean }
  >()
    .set('deploymentconfigs', { kind: 'DeploymentConfig' })
    .set('buildconfigs', { kind: 'BuildConfig' })
    .set('imagestreams', { kind: 'ImageStream' })
    .set('routes', { kind: 'Route' })
    .set('user.openshift.io~v1~Group', {
      kind: 'user.openshift.io~v1~Group',
      namespaced: false,
      testI18n: false,
    });
  const serviceCatalogObjs = OrderedMap<
    string,
    { kind: string; namespaced?: boolean; testI18n?: boolean }
  >().set('clusterservicebrokers', {
    kind: 'servicecatalog.k8s.io~v1beta1~ClusterServiceBroker',
    namespaced: false,
    testI18n: false,
  });

  let testObjs = Cypress.env('openshift') === true ? k8sObjs.merge(openshiftObjs) : k8sObjs;
  testObjs = Cypress.env('servicecatalog') === true ? testObjs.merge(serviceCatalogObjs) : testObjs;
  const testLabel = 'automated-test-name';
  const resourcesWithCreationForm = new Set([
    'StorageClass',
    'Route',
    'PersistentVolumeClaim',
    'snapshot.storage.k8s.io~v1beta1~VolumeSnapshot',
  ]);

  testObjs.forEach(
    ({ kind, namespaced = true, humanizeKind = true, testI18n = true }, resource) => {
      // Ex: to execute just the Pod crud tests, set environment var 'cypress_k8sTestResource=Pod' before running cypress
      if (Cypress.env('k8sTestResource') && kind !== Cypress.env('k8sTestResource')) {
        return;
      }
      describe(kind, () => {
        const name = `${testName}-${_.kebabCase(kind)}`;

        it(`creates the resource instance`, () => {
          cy.visit(
            `${namespaced ? `/k8s/ns/${testName}` : '/k8s/cluster'}/${resource}?name=${testName}`,
          );
          if (kind === 'Secret') {
            listPage.clickCreateYAMLdropdownButton();
          } else {
            listPage.clickCreateYAMLbutton();
          }
          if (resourcesWithCreationForm.has(kind)) {
            cy.byTestID('yaml-link').click();
          }
          // sidebar needs to be fully loaded, else it sometimes overlays the Create button
          cy.byTestID('resource-sidebar').should('exist');
          yamlEditor.isLoaded();
          cy.testA11y(`YAML Editor for ${kind}: ${name}`);
          let newContent;
          // get, update, and set yaml editor content.
          yamlEditor.getEditorContent().then((content) => {
            newContent = _.defaultsDeep(
              {},
              { metadata: { name, labels: { [testLabel]: testName } } },
              safeLoad(content),
            );
            yamlEditor.setEditorContent(safeDump(newContent, { sortKeys: true })).then(() => {
              yamlEditor.clickSaveCreateButton();
              cy.get(errorMessage).should('not.exist');
            });
          });
        });

        it('displays detail view for newly created resource instance', () => {
          cy.url().should('include', `/${name}`);
          detailsPage.isLoaded();
          detailsPage.titleShouldContain(name);
          cy.testA11y(`Details page for ${kind}: ${name}`);
          if (testI18n) {
            cy.testI18n([
              DetailsPageSelector.horizontalNavTabs,
              DetailsPageSelector.sectionHeadings,
              DetailsPageSelector.itemLabels,
            ]);
          }
        });

        it(`displays a list view for the resource`, () => {
          cy.visit(
            `${namespaced ? `/k8s/ns/${testName}` : '/k8s/cluster'}/${resource}?name=${testName}`,
          );
          if (namespaced) {
            // should have a namespace dropdown for namespaced objects');
            projectDropdown.shouldExist();
            projectDropdown.shouldContain(testName);
          } else {
            // should not have a namespace dropdown for non-namespaced objects');
            projectDropdown.shouldNotExist();
          }
          listPage.rows.shouldBeLoaded();
          cy.testA11y(`List page for ${kind}: ${name}`);
          if (testI18n) {
            cy.testI18n([ListPageSelector.tableColumnHeaders], ['item-create']);
          }
        });

        it('search view displays created resource instance', () => {
          cy.visit(
            `/search/${
              namespaced ? `ns/${testName}` : 'all-namespaces'
            }?kind=${kind}&q=${testLabel}%3d${testName}&name=${name}`,
          );

          // filter should have 3 chip groups: resource, label, and name
          listPage.filter.numberOfActiveFiltersShouldBe(3);
          listPage.rows.shouldExist(name);
          cy.testA11y(`Search page for ${kind}: ${name}`);

          // link to to details page
          listPage.rows.clickRowByName(name);
          cy.url().should('include', `/${name}`);
          detailsPage.titleShouldContain(name);
        });

        it('edits the resource instance', () => {
          cy.visit(
            `/search/${
              namespaced ? `ns/${testName}` : 'all-namespaces'
            }?kind=${kind}&q=${testLabel}%3d${testName}&name=${name}`,
          );
          listPage.rows.clickKebabAction(name, editKind(kind, humanizeKind));
          if (kind !== 'Secret') {
            yamlEditor.isLoaded();
            yamlEditor.clickReloadButton();
          }
          yamlEditor.clickSaveCreateButton();
        });

        it(`deletes the resource instance`, () => {
          cy.visit(`${namespaced ? `/k8s/ns/${testName}` : '/k8s/cluster'}/${resource}`);
          listPage.filter.byName(name);
          listPage.rows.countShouldBe(1);
          listPage.rows.clickKebabAction(name, deleteKind(kind, humanizeKind));
          modal.shouldBeOpened();
          modal.submit();
          modal.shouldBeClosed();
          cy.resourceShouldBeDeleted(testName, resource, name);
        });
      });
    },
  );
});
