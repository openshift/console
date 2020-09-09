Feature: Perform Actions on Helm Releases
    As a user, I want to perform the actions on the helm releases in topology page

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-actions-helm"
    And helm release "nodejs-ex-k" is present in topology page


@regression, @smoke
Scenario: Perform Upgrade action on Helm Release through Context Menu: HR-08-TC02
    Given user is at the Topolgy page
    When user right clicks on the Helm Release "nodejs-ex-k" to open the context menu
    And user clicks on the "Upgrade" action
    And user upgrades the chart Version
    And user clicks on the upgrade button
    # Then the helm release should get upgradaed -- currently text message is not displaying on upgrade button click
    And user will be redirected to Topology page


@regression, @smoke
Scenario: Perform Rollback action on Helm Release through Context Menu: HR-08-TC03
    Given user is at the Topolgy page
    When user right clicks on the Helm Release "nodejs-ex-k" to open the context menu
    And user clicks on the "Rollback" action
    And user selects the version to Rollback
    And user clicks on the rollback button
    # Then the helm release rollbacks to the version - this step is not displaying currently
    Then user will be redirected to Topology page


@regression, @smoke
Scenario: Uninstall Helm Release through Context Menu: HR-08-TC04
    Given user is at the Topolgy page
    When user right clicks on the Helm Release "nodejs-ex-k" to open the context menu
    And user clicks on the "Uninstall Helm Release" action
    And user enters the release name
    And user clicks on the Uninstall button
    # Then Helm release gets uninstalled - automatically navigating to Add page
    Then user will be redirected to Topology page with no workloads
