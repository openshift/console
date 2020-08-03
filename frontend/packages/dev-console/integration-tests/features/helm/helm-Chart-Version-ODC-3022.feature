Feature: Helm Chart
    User will be able to update the chart versions or values config of a helm release


Background:
    Given user logged into the openshift application
    And user is at developer perspecitve


@regression, @smoke
Scenario: Install Helm Chart from +Add Page using Form View: HR-02-TC01
    Given user is at +Add page
    When user clicks on the Helm Chart card on the +Add page
    And user searches for the 'Node-ex-k' helm chart
    And user clicks on the 'Node-ex-k' helm chart card
    And user clicks on the Install Helm Chart button
    And user enters a Release name
    And user updates the Chart Version
    And user clicks on the Install button
    Then user is redirected to Topology page
    And Topology page have the helm chart workload


@regression
Scenario: Grouping of Helm multiple chart versions together in developer catalog
    Given user is at the developer catalog page
    When user checks the Helm Charts checkbox
    And user searches for the 'Node-ex-k' helm chart
    Then user will see the only one helm chart item for all chart versions


@regression
Scenario: Chart versions drop down menu
    Given user is at the developer catalog page
    When user checks the Helm Charts checkbox
    And user searches for the 'Node-ex-k' helm chart
    And user clicks on the 'Node-ex-k' helm chart card
    And user will see the information of all the chart versions together
    And user clicks on the Install Helm Chart button
    Then the user will see the chart version dropdown


@regression, @manual
Scenario: Update the chart version to see the alert modal
    Given user is at the Install Helm Chart page
    When user does some changes on the yaml editor
    And user clicks on the Chart Versioon dropdown menu
    And user selects the different chart version
    Then modal will get popped up
    And modal will have the old and new chart versions
    And modal will have the warning of data lost


@regression, @manual
Scenario: README should be updated when chart version is updated
    Given user is at the Install Helm Chart page
    When user clicks on the Chart Version dropdown menu
    And user selects the different chart version
    And modal will get popped up
    And user clicks on yes to update the chart version
    Then user will see that the README is also updated with new chart version
