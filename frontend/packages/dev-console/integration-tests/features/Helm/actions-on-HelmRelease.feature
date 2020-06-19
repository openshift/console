Feature: Helm Chart
    User will be able to perform the actions on the helm releases


Background:
    Given user logged into the openshift application
    And user is at developer perspecitve


@regression, @smoke
Scenario: Perform Upgrade action on Helm Release through Context Menu: HR-08-TC02
    Given user is at Topology page
    When user right clicks on the Helm Release to open the context menu
    And user clicks on the Upgrade action
    And user updates the chart Version
    And user clicks on the upgrade button
    Then the helm release should get upgradaed
    And user gets redirected to topology page


@regression, @smoke
Scenario: Perform Rollback action on Helm Release through Context Menu: HR-08-TC03
    Given user is at Topology page
    When user right clicks on the Helm Release to open the context menu
    And user clicks on the Rollback action
    And user selects the version to Rollback
    And user clicks on the rollback button
    Then the helm release rollbacks to the version
    And user gets redircted to topology page


@regression, @smoke
Scenario: Uninstall Helm Release through Context Menu: HR-08-TC04
    Given user is at Topology page
    When user right clicks on the Helm Release to open the context menu
    And user clicks on the Uninstall action
    And user enters the release name
    And user clicks on the Delete button
    Then Helm release gets deleted
