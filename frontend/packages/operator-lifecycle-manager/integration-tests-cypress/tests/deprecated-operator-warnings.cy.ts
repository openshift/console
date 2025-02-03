import { checkErrors, create } from '../../../integration-tests-cypress/support';
import { testDeprecatedCatalogSource, testDeprecatedSubscription } from '../mocks';
import { operator } from '../views/operator.view';

const TIMEOUT = { timeout: 300000 };
const testOperatorName = 'Kiali Community Operator';
const testOperator = {
  name: 'Kiali Operator',
  operatorHubCardTestID: 'datagrid-redhat-operators-openshift-marketplace',
};
const deprecatedBadge = 'Deprecated';
const deprecatedPackageMessage =
  "package kiali is end of life. Please use 'kiali-new' package for support.";
const deprecatedChannelMessage =
  "channel alpha is no longer supported. Please switch to channel 'stable'.";
const deprecatedVersionMessage =
  'kiali-operator.v1.68.0 is deprecated. Uninstall and install kiali-operator.v1.72.0 for support.';
const DEPRECATED_OPERATOR_WARNING_BADGE_ID = 'deprecated-operator-warning-badge';
const DEPRECATED_OPERATOR_WARNING_PACKAGE_ID = 'deprecated-operator-warning-package';
const DEPRECATED_OPERATOR_WARNING_CHANNEL_ID = 'deprecated-operator-warning-channel';
const DEPRECATED_OPERATOR_WARNING_VERSION_ID = 'deprecated-operator-warning-version';

describe('Deprecated operator warnings', () => {
  before(() => {
    cy.login();
    create(testDeprecatedCatalogSource);
  });

  after(() => {
    cy.visit('/');
    cy.exec(
      `oc delete subscription ${testDeprecatedSubscription.metadata.name} -n ${testDeprecatedSubscription.metadata.namespace}`,
    );
    cy.exec(
      `oc delete clusterserviceversion ${testDeprecatedSubscription.spec.startingCSV} -n ${testDeprecatedSubscription.metadata.namespace}`,
    );
    cy.exec(
      `oc delete ${testDeprecatedCatalogSource.kind} ${testDeprecatedCatalogSource.metadata.name} -n ${testDeprecatedCatalogSource.metadata.namespace}`,
    );
    checkErrors();
  });

  it('verify deprecated operator warning badge on the OperatorHub tile', () => {
    cy.visit(
      `/k8s/ns/${testDeprecatedCatalogSource.metadata.namespace}/operators.coreos.com~v1alpha1~CatalogSource/test-community-operator-deprecation`,
    );
    cy.log('verify the test-community-operator-deprecation CatalogSource is in "READY" status');
    cy.byTestSelector('details-item-value__Status', TIMEOUT).should('have.text', 'READY');

    cy.log('visit OperatorHub');
    cy.visit('/operatorhub/all-namespaces');

    cy.log('filter by the group name');
    cy.byTestID('source-community-operators-for-testing-deprecation').click();

    cy.log('filter by the operator name');
    cy.byTestID('search-operatorhub').type(testOperatorName);
    cy.get('.co-catalog-tile', TIMEOUT).its('length').should('eq', 1);

    cy.log('verify the Deprecated badge on Kiali Community Operator tile');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_BADGE_ID).contains(deprecatedBadge).should('exist');
  });
  it('verify deprecated operator warnings in the OperatorHub details panel', () => {
    cy.visit(
      '/operatorhub/all-namespaces?keyword=kia&details-item=kiali-test-community-operator-deprecation-openshift-marketplace&channel=stable&version=1.83.0',
    );
    cy.log('verify the deprecated operator badge exists');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_BADGE_ID).contains(deprecatedBadge).should('exist');

    cy.log('verify the package deprecation warning exists when viewing a deprecated operator');
    cy.byTestID('deprecated-operator-warning-package')
      .contains(deprecatedPackageMessage)
      .should('exist');
  });

  it('verify deprecated channel warnings in the OperatorHub details panel', () => {
    cy.visit(
      '/operatorhub/all-namespaces?keyword=kia&details-item=kiali-test-community-operator-deprecation-openshift-marketplace&channel=stable&version=1.83.0',
    );

    cy.log('verify the channel deprecation warnings do not exist yet');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_PACKAGE_ID)
      .contains(deprecatedChannelMessage)
      .should('not.exist');
    cy.byTestID('deprecated-operator-warning-channel-icon').should('not.exist');
    cy.log('verify the channel deprecation warning icon exists in the channel select menu');
    // force click because parent PF modal component causes button not to be "visible"
    cy.byTestID('operator-channel-select-toggle').should('exist').click({
      force: true,
    });
    cy.byTestID('deprecated-operator-warning-channel-icon').should('exist');
    // force click because parent PF modal component causes button not to be "visible"
    cy.get('[data-test="channel-option-alpha"] > button').click({ force: true });

    cy.log('verify the channel deprecation alert exists after selecting a deprecated channel');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_CHANNEL_ID)
      .contains(deprecatedChannelMessage)
      .should('exist');
  });

  it('verify deprectaed version warnings in the OperatorHub details panel', () => {
    cy.visit(
      '/operatorhub/all-namespaces?keyword=kia&details-item=kiali-test-community-operator-deprecation-openshift-marketplace&channel=stable&version=1.83.0',
    );

    cy.log('verify the version deprecation warnings do not exist yet');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID)
      .contains(deprecatedVersionMessage)
      .should('not.exist');
    cy.byTestID('deprecated-operator-warning-version-icon').should('not.exist');
    cy.log('verify the version deprecation warning icon exists in the version select menu');
    // force click because parent PF modal component causes button not to be "visible"
    cy.byTestID('operator-version-select-toggle').click({
      force: true,
    });
    cy.byTestID('deprecated-operator-warning-version-icon').should('exist');
    // force click because parent PF modal component causes button not to be "visible"
    cy.get('[data-test="version-option-kiali-operator.v1.68.0"] > button').click({ force: true });
    cy.log(
      'verify the version deprecation warning alert exists after selecting a deprecated version',
    );
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID)
      .contains(deprecatedVersionMessage)
      .should('exist');
  });

  it('verify deprecated operator warnings on Install Operator details page', () => {
    cy.log('visit the Install Operator details page');
    cy.visit(
      '/operatorhub/subscribe?pkg=kiali&catalog=test-community-operator-deprecation&catalogNamespace=openshift-marketplace&targetNamespace=undefined&channel=alpha&version=1.68.0',
    );

    cy.log('verify the Deprecated badge on Kiali Community Operator logo');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_BADGE_ID).contains(deprecatedBadge).should('exist');

    cy.log('verify the deprecation warning messages exists');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_PACKAGE_ID)
      .contains(deprecatedPackageMessage)
      .should('exist');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_CHANNEL_ID)
      .contains(deprecatedChannelMessage)
      .should('exist');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID)
      .contains(deprecatedVersionMessage)
      .should('exist');
  });

  it('verify deprecated operator warning badge on Installed Operators page', () => {
    cy.log(
      'install the Kiali Community Operator with the deprecated package, channel and version messages',
    );
    create(testDeprecatedSubscription);

    cy.log('visit the Installed Operators Subscription tab');
    cy.visit(
      `/k8s/ns/${testDeprecatedSubscription.metadata.namespace}/operators.coreos.com~v1alpha1~Subscription/kiali`,
    );

    cy.log('verify the Kiali Community Operator Subscription requires approval');
    cy.byTestID('operator-subscription-requires-approval', TIMEOUT).should(
      'have.text',
      '1 requires approval',
    );

    cy.log('approve the Kiali Community Operator Subscription');
    cy.exec(
      `oc patch installplan $(oc get installplan -n ${testDeprecatedSubscription.metadata.namespace} --no-headers | grep kiali-operator.v1.68.0 | grep Manual | awk '{print $1}') -n ${testDeprecatedSubscription.metadata.namespace} --type merge --patch '{"spec":{"approved":true}}'`,
    );

    cy.log('visit the Installed Operators details page and verify the deprecated operator badge');
    operator.installedSucceeded(testOperator.name, 'openshift-operators');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_BADGE_ID, TIMEOUT)
      .contains(deprecatedBadge)
      .should('exist');
  });

  it('verify deprecated operator warnings on installed operator details page', () => {
    cy.log('visit the Installed Operators details page');
    cy.visit(
      `/k8s/ns/${testDeprecatedSubscription.metadata.namespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/kiali-operator.v1.68.0`,
    );

    cy.log('verify the Deprecated badge on Kiali Community Operator logo');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_BADGE_ID).contains(deprecatedBadge).should('exist');

    cy.log(
      'verify that the deprecated messages for package, channel, and version are displayed on the installed operator details tab.',
    );
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_PACKAGE_ID)
      .contains(deprecatedPackageMessage)
      .should('exist');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_CHANNEL_ID)
      .contains(deprecatedChannelMessage)
      .should('exist');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID)
      .contains(deprecatedVersionMessage)
      .should('exist');
  });

  it('verify deprecated operator warnings on installed operator details subscription tab', () => {
    cy.log('visit the Installed Operators subscription tab');
    cy.visit(
      `/k8s/ns/${testDeprecatedSubscription.metadata.namespace}/operators.coreos.com~v1alpha1~ClusterServiceVersion/kiali-operator.v1.68.0/subscription`,
    );

    cy.log(
      'verify that the deprecated messages for package, channel, and version are displayed on the installed operator subscription tab.',
    );
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_PACKAGE_ID)
      .contains(deprecatedPackageMessage)
      .should('exist');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_CHANNEL_ID)
      .contains(deprecatedChannelMessage)
      .should('exist');
    cy.byTestID(DEPRECATED_OPERATOR_WARNING_VERSION_ID)
      .contains(deprecatedVersionMessage)
      .should('exist');

    cy.log('verify that the deprecated operator subscription update icon is displayed');
    cy.byTestID('deprecated-operator-warning-subscription-update-icon').should('exist');

    cy.log(
      'verify that the deprecated operator subscription update icon is displayed on the change subscription update channel modal',
    );
    cy.byTestID('subscription-channel-update-button').click();
    cy.byTestID('kiali-operator.v1.83.0').should('exist');
  });
});
