Feature: Helm Chart
    User will be able to navigate to Helm tab

Background:
    Given user logged into the openshift application
    And user is at developer perspecitve


@regression, @smoke
Scenario: Open the Helm tab on the navigation bar when helm charts are absent: HR-11-TC02
    Given user is at the developer perspecitve
    When user clicks on the Helm tab
    Then helm releases page will get opened
    And user will see the message of no helm charts present
    And user will get the link to install helm charts from developer catalog


@regression, @smoke
Scenario: Install Helm Chart: HR-02-TC01
    Given user is at +Add page
    When user clicks on the Helm Chart card on the +Add page
    And user searches for the 'Node-ex-k' helm chart
    And user clicks on the 'Node-ex-k' helm chart card
    And user clicks on the Install Helm Chart button
    And user clicks on the Install button
    Then user is redirected to Topology page
    And Topology page have the helm chart workload


@regression, @smoke
Scenario: Open the Helm tab on the navigation bar when helm charts are present: HR-11-TC01
    Given user is at the developer perspecitve
    When user clicks on the Helm tab
    Then helm releases page will get opened
    And user will see the helm charts listed


@regression
Scenario: Enable the deployed helm charts' filter: HR-11-TC02
    Given user is at the Helm page
    When user clicks on the filter drop down menu
    And user selects checkbox for the Deployed Helm charts
    Then the checkbox for the Deployed Helm chart is checked
    And helm charts with status deployed are listed


@regression
Scenario: Enable the failed helm charts' filter: HR-11-TC03
    Given user is at the Helm page
    When user clicks on the filter drop down menu
    And user selects checkbox for the Failed Helm charts
    Then the checkbox for the Failed Helm chart is checked
    And helm charts with status failed are listed


@regression
Scenario: Enable the other helm charts' filter: HR-11-TC04
    Given user is at the Helm page
    When user clicks on the filter drop down menu
    And user selects checkbox for the Other Helm charts
    Then the checkbox for the Other Helm chart is checked
    And helm charts with status other are listed


@regression
Scenario: Select all filters: HR-11-TC05
    Given user is at Helm page
    When user clicks on the filter drop down menu 
    And user selects checkbox for the Deployed Helm charts
    And user selects checkbox for the Failed Helm charts
    And user selects checkbox for the Other Helm charts
    Then the checkbox for the Deployed Helm chart is checked
    And the checkbox for the Failed Helm chart is checked
    And the checkbox for the Other Helm chart is checked


@regression
Scenario: Clear all filters: HR-11-TC06
    Given user has selected all filters
    When user click on the clear all filters button
    Then all filters selected will get removed


@regression
Scenario: Search for the Helm Chart: HR-11-TC07
    Given user is at Helm page
    When user searches for a helm chart
    Then the helm charts with that search name will be shown


@regression, @smoke
Scenario: Click on the helm chart name to open the helm release details page: HR-11-TC08
    Given user is at Helm page
    When user clicks on the helm release name
    Then user will see the Details page opened
    And user will see the Resources tab
    And user will see the Revision History tab
    And user will see the Release Notes tab
    And user will see the Actions drop down menu
    And user sees the Upgrade action item
    And user sees the Rollback action item
    And user sees the Uninstall Helm Release action item
