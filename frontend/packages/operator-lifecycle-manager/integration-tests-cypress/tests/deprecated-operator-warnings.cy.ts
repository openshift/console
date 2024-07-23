// import { checkErrors, testName } from '../../../integration-tests-cypress/support';
// import { nav } from '@console/cypress-integration-tests/views/nav';
// import * as yamlEditor from '@console/cypress-integration-tests/views/yaml-editor';
// // import {
// //     PackageManifestKind,
// //   } from '@operator-lifecycle/src/types';

// const amqPackageManifest = {
//     apiVersion: 'packages.operators.coreos.com/v1' as any['apiVersion'],
//     kind: 'PackageManifest' as any['kind'],
//     metadata: {
//       name: 'amq-streams',
//       namespace: 'openshift-operator-lifecycle-manager',
//       creationTimestamp: '2018-10-23T12:50:22Z',
//       labels: {
//         catalog: 'rh-operators',
//         'catalog-namespace': 'openshift-operator-lifecycle-manager',
//         provider: 'Red Hat',
//         'provider-url': '',
//       },
//     },
//     spec: {},
//     status: {
//       catalogSource: 'rh-operators',
//       catalogSourceDisplayName: 'Red Hat Operators',
//       catalogSourcePublisher: 'Red Hat',
//       catalogSourceNamespace: 'openshift-operator-lifecycle-manager',
//       provider: {
//         name: 'Red Hat',
//       },
//       packageName: 'amq-streams',
//       deprecation: { message: 'This package is deprecated' },
//       channels: [
//         {
//           name: 'preview',
//           currentCSV: 'amqstreams.v1.0.0.beta',
//           deprecation: { message: 'This channel is deprecated' },
//           currentCSVDesc: {
//             displayName: 'AMQ Streams',
//             icon: [],
//             version: '1.0.0-Beta',
//             provider: {
//               name: 'Red Hat',
//             },
//             installModes: [],
//             annotations: {
//               'alm-examples':
//                 '[{"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"Kafka","metadata":{"name":"my-cluster"},"spec":{"kafka":{"replicas":3,"listeners":{"plain":{},"tls":{}},"config":{"offsets.topic.replication.factor":3,"transaction.state.log.replication.factor":3,"transaction.state.log.min.isr":2},"storage":{"type":"ephemeral"}},"zookeeper":{"replicas":3,"storage":{"type":"ephemeral"}},"entityOperator":{"topicOperator":{},"userOperator":{}}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaConnect","metadata":{"name":"my-connect-cluster"},"spec":{"replicas":1,"bootstrapServers":"my-cluster-kafka-bootstrap:9093","tls":{"trustedCertificates":[{"secretName":"my-cluster-cluster-ca-cert","certificate":"ca.crt"}]}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaConnectS2I","metadata":{"name":"my-connect-cluster"},"spec":{"replicas":1,"bootstrapServers":"my-cluster-kafka-bootstrap:9093","tls":{"trustedCertificates":[{"secretName":"my-cluster-cluster-ca-cert","certificate":"ca.crt"}]}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaTopic","metadata":{"name":"my-topic","labels":{"strimzi.io/cluster":"my-cluster"}},"spec":{"partitions":10,"replicas":3,"config":{"retention.ms":604800000,"segment.bytes":1073741824}}}, {"apiVersion":"kafka.strimzi.io/v1alpha1","kind":"KafkaUser","metadata":{"name":"my-user","labels":{"strimzi.io/cluster":"my-cluster"}},"spec":{"authentication":{"type":"tls"},"authorization":{"type":"simple","acls":[{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Read","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Describe","host":"*"},{"resource":{"type":"group","name":"my-group","patternType":"literal"},"operation":"Read","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Write","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Create","host":"*"},{"resource":{"type":"topic","name":"my-topic","patternType":"literal"},"operation":"Describe","host":"*"}]}}}]',
//               description:
//                 '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project. \nAMQ Streams provides an event streaming backbone that allows microservices and other application components to exchange data with extremely high throughput and low latency.\n\n**The core capabilities include**\n* A pub/sub messaging model, similar to a traditional enterprise messaging system, in which application components publish and consume events to/from an ordered stream\n* The long term, fault-tolerant storage of events\n* The ability for a consumer to replay streams of events\n* The ability to partition topics for horizontal scalability\n\n# Before you start\n\n1. Create AMQ Streams Cluster Roles\n```\n$ oc apply -f http://amq.io/amqstreams/rbac.yaml\n```\n2. Create following bindings\n```\n$ oc adm policy add-cluster-role-to-user strimzi-cluster-operator -z strimzi-cluster-operator --namespace <namespace>\n$ oc adm policy add-cluster-role-to-user strimzi-kafka-broker -z strimzi-cluster-operator --namespace <namespace>\n```',
//               categories: 'messaging,streaming',
//             },
//           },
//           entries: [
//             {
//               name: 'version TestOwnedResource',
//               version: '0.0.1',
//               deprecation: {
//                 message: 'The version is deprecated',
//               },
//             },
//           ],
//         },
//       ],
//       defaultChannel: '',
//     },
//   };
// describe('Interacting with OperatorHub', () => {
//   before(() => {
//     cy.login();
//     cy.createProjectWithCLI(testName);
//   });

//   afterEach(() => {
//     checkErrors();
//   });

//   after(() => {
//     cy.deleteProjectWithCLI(testName);
//   });

//  const POD_CREATED_ALIAS = 'podCreated';
//   const pod1ReqObj = `kind: CatalogSource
//   apiVersion: operators.coreos.com/v1alpha1
//   metadata:
//     name: test-community-operator-deprecation
//     namespace: openshift-marketplace
//   spec:
//     displayName: Community Operators for testing deprecation
//     image: 'quay.io/jordankeister/deprecation-catalog:latest'
//     publisher: OLM community
//     sourceType: grpcF
//     updateStrategy:
//       registryPoll:
//         interval: 10m
//   `
//   it('Create a pod and display Admission Webhook warning notification', () => {
//     cy.visit(`/k8s/ns/${testName}/import`);

//     yamlEditor.isImportLoaded();
//     yamlEditor.setEditorContent(pod1ReqObj).then(() => {
//       cy.intercept('GET', `api/kubernetes/apis/packages.operators.coreos.com/v1/packagemanifests?limit=250&labelSelector=openshift-marketplace%3Dtrue`, (req) => {
//         req.continue((res) => {
//         //   res.headers = {
//         //     Warning: WARNING_FOO,
//         //   };
//         res.body.items.push(amqPackageManifest);
//         });
//       }).as(POD_CREATED_ALIAS);
//     //   yamlEditor.clickSaveCreateButton();
//     //   cy.wait(`@${POD_CREATED_ALIAS}`, WAIT_OPTION);
//     //   detailsPage.sectionHeaderShouldExist('Pod details');
//     //   cy.byTestID(WARNING_ID).contains('Admission Webhook Warning');
//     //   cy.byTestID(WARNING_ID).contains(`Pod ${POD_NAME}-a violates policy ${WARNING_FOO}`);
//     //   cy.byTestID(LEARN_MORE_ID).contains('Learn more').click();
//     });
//   });
//   it('displays OperatorHub tile view with expected available Operators', () => {
//     cy.log('navigate to OperatorHub');
//     nav.sidenav.clickNavLink(['Operators', 'OperatorHub']);
//     // cy.url().should('include', '/operatorhub/all-namespaces');
//     // cy.log('more than one tile should be present');
//     // cy.get('.co-catalog-tile').its('length').should('be.gt', 0);

//     // cy.log('enable the Community filter');
//     // cy.byTestID('catalogSourceDisplayName-community').click();
//     // cy.log('more than one tile should be present');
//     // cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
//     // cy.log('track which tile is first');
//     // eslint-disable-next-line promise/catch-or-return
//     // cy.get('.co-catalog-tile')
//     //   .first()
//     //   .then(($origCatalogTitle) => {
//     //     const origCatalogTitleTxt = $origCatalogTitle.find('.catalog-tile-pf-title').text();
//     //     cy.log(`first Community filtered tile title text is ${origCatalogTitleTxt}`);
//     //     cy.log('disable the Community filter');
//     //     cy.byTestID('catalogSourceDisplayName-community').click();
//     //     cy.log('enable the Certified filter');
//     //     cy.byTestID('catalogSourceDisplayName-certified').click();
//     //     cy.log('more than one tile should be present');
//     //     cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
//     //     cy.log('the first tile title text for Certified should not be the same as Community');
//     //     cy.get('.co-catalog-tile')
//     //       .first()
//     //       .find('.catalog-tile-pf-title')
//     //       .invoke('text')
//     //       .should('not.equal', origCatalogTitleTxt);
//     //   });

//     cy.log('filters Operators by name');
//     const operatorName = 'Kiali Community Operator';
//     cy.byTestID('search-operatorhub').type(operatorName);
//     // cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
//     // cy.get('.co-catalog-tile')
//     //   .first()
//     //   .find('.catalog-tile-pf-title')
//     //   .should('have.text', operatorName);
//     // cy.byTestID('search-operatorhub').find('input').clear();

//     // cy.log('displays "Clear All Filters" link when text filter removes all Operators from display');
//     // cy.log('enter a search query that will return zero results');
//     // cy.byTestID('search-operatorhub').type('NoOperatorsTest');
//     // cy.get('.co-catalog-tile').should('not.exist');
//     // cy.byLegacyTestID('catalog-clear-filters').should('exist');

//     // cy.log('clears text filter when "Clear All Filters" link is clicked');
//     // cy.byLegacyTestID('catalog-clear-filters').click();
//     // cy.byTestID('search-operatorhub').get('input').should('be.empty');
//     // cy.get('.co-catalog-tile').its('length').should('be.gt', 0);

//     // cy.log('filters Operators by category');
//     // const filterLabel = 'AI/Machine Learning';
//     // cy.log(`click the ${filterLabel} filter`);
//     // cy.get(`[data-test="${filterLabel}"] > a`).click();
//     // cy.get('.co-catalog-tile').its('length').should('be.gt', 0);
//   });
// });
