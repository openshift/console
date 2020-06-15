Feature: Helm Chart
    User should able to perform the actions on the helm releases

Background:
    Given user logged into the openshift application
    And user is at developer perspecitve


@regression, @smoke
Scenario: Perform Upgrade action on Helm Release through Context Menu: HR-08-TC02
    Given user is at the opened the context menu
    When user clicks on the Upgrade action
    And user updates the chart Version
    And user clicks on the upgrade button
    Then the helm release should get upgradaed 
    And user should get redirected to topology page


@regression, @smoke
Scenario: Perform Rollback action on Helm Release through Context Menu: HR-08-TC03
    Given user is at the opened the context menu
    When user clicks on the Rollback action
    And user selects the version to Rollback
    And user clicks on the rollback button
    Then the helm release should rollback to the version
    And user should get redircted to topology page


@regression, @smoke
Scenario: Uninstall Helm Release through Context Menu: HR-08-TC04
    Given user is at the opened the context menu
    When user clicks on the Uninstall action
    And user enters the release name
    And user clicks on the Delete button
    Then Helm release should get deleted