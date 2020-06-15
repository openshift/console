Feature: Helm Chart
    User should able to install the helm charts

Background:
    Given user logged into the openshift application
    And user is at developer perspecitve


@regression, @smoke
Scenario: The Helm Chart option on the +Add Page: HR-01-TC01
    Given user is at +Add page
    When user clicks on the Helm Chart card on the +Add page
    Then the Developer Catalog page should open 
    And the checkbox for Helm Charts should be checked
    And there should be Helm Charts listed


@regression, @smoke
Scenario: Install Helm Chart from +Add Page using Form View: HR-02-TC01
    Given user is at +Add page
    When user clicks on the Helm Chart card on the +Add page
    And user searches for the 'Node-ex-k' helm chart 
    And user clicks on the 'Node-ex-k' helm chart card
    And user clicks on the Install Helm Chart button
    And user selects the Form View
    And user enters the required field
    And user updates the Chart Version
    And user clicks on the Install button
    Then user should be redirected to Topology page
    And Topology page should have the helm chart workload 


@regression
Scenario: Install Helm Chart from Developer Catalog Page using YAML View: HR-03
    Given user is at +Add page
    When user clicks on the Developer Catalog card on the +Add page
    And user checks the Helm Charts checkbox
    And user searches for the 'Node-ex-k' helm chart 
    And user clicks on the 'Node-ex-k' helm chart card
    And user clicks on the Install Helm Chart button
    And user selects the YAML View
    And user updates the Chart Version
    And user clicks on the Install button
    Then user should be redirected to Topology page
    And Topology page should have the helm chart workload 


@regression, @smoke
Scenario: Open context menu and check the actions available: HR-07-TC01
    Given user is on the Topology page
    When user have right-clicked on the workload
    Then user should see the context menu with actions