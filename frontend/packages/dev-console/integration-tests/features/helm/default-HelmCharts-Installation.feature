Feature: Install the Helm Chart
    As a user, I want to install the helm charts

Background:
    Given user is at developer perspecitve
    And user is at the project namespace "aut-helm-installation" in dev perspecitve 


@regression, @smoke
Scenario: The Helm Chart option on the +Add Page: HR-01-TC01
    Given user is at Add page
    Then user can see Helm Chart card on the +Add page


@regression, @smoke
Scenario: Catalog Page display on selecitng Helm chart: HR-01-TC02, HR-02-TC02
    Given user is at Add page
    When user clicks on the Helm Chart card on the +Add page
    Then user redirects to Developer Catalog page
    And user able to see Helm Chart option is selected in Developer Catalog page
    And user able to see Helm Charts cards


@regression
Scenario: Install Helm Chart from Developer Catalog Page: HR-03
    Given user is at Add page
    When user clicks on the Developer Catalog card on the +Add page
    And user checks the Helm Charts checkbox
    And user searches for the "Nodejs Ex K v0.2.0" helm chart
    And user clicks on the "Nodejs Ex K v0.2.0" helm chart card
    And user clicks on the Install Helm Chart button on side pane
    And user clicks on the Install button
    Then user is redirected to Topology page
    And Topology page have the helm chart workload


@regression, @smoke
Scenario: Open context menu and check the actions available: HR-07-TC01
    Given user is at Topology page
    When user right clicks on the workload
    Then user sees the context menu with actions
    And user sees the Upgrade action item
    And user sees the Rollback action item
    And user sees the Uninstall Helm Release action item
