Feature: Perform Actions on Helm Releases
    As a user, I want to perform the actions on the helm releases in topology page

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-actions-helm"
    And helm release "nodejs-ex-k" is present in topology page


@regression, @smoke
Scenario: Context menu options of helm release: HR-07-TC01
    Given user is on topology page
    When user right clicks on the helm release "nodejs-ex-k"
    Then user is able to see the context menu with actions Upgrade, Rollback and Uninstall Helm Release


@regression, @smoke
Scenario: Actions drop down on the side bar: HR-10-TC08
    Given user is on the topology sidebar of the helm release "nodejs-ex-k"
    When user clicks on the Actions drop down menu
    Then user is able to see the actions dropdown menu with actions Upgrade, Rollback and Uninstall Helm Release


@regression, @smoke
Scenario: Actions menu on Helm page
    Given user is on the Helm page with helm release "nodejs-ex-k"
    When user clicks on the Kebab menu
    Then user is able to see kebab menu with actions Upgrade, Rollback and Uninstall Helm Release


@regression, @smoke
Scenario: Perform Upgrade action on Helm Release through Context Menu: HR-08-TC02
    Given user is at the Topolgy page
    When user right clicks on the Helm Release "nodejs-ex-k" to open the context menu
    And user clicks on the "Upgrade" action
    And user upgrades the chart Version
    And user clicks on the upgrade button
    Then user will be redirected to Topology page


@regression, @smoke
Scenario: Perform Rollback action on Helm Release through Context Menu: HR-08-TC03
    Given user is at the Topolgy page
    When user right clicks on the Helm Release "nodejs-ex-k" to open the context menu
    And user clicks on the "Rollback" action
    And user selects the version to Rollback
    And user clicks on the rollback button
    Then user will be redirected to Topology page


@regression, @smoke
Scenario: Uninstall Helm Release through Context Menu: HR-08-TC04
    Given user is at the Topolgy page
    When user right clicks on the Helm Release "nodejs-ex-k" to open the context menu
    And user clicks on the "Uninstall Helm Release" action
    And user enters the release name
    And user clicks on the Uninstall button
    Then user will be redirected to Topology page with no workloads named "nodejs-ex-k"
