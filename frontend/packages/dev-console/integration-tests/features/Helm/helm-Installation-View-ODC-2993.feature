Feature: Helm Chart
    User will be able to updated the chart versions of the helm charts


Background:
    Given user logged into the openshift application
    And user is at developer perspecitve


@regression, @smoke, @ODC-3022
Scenario: Install Helm Chart from +Add Page using Form View: HR-02-TC01
    Given user is at +Add page
    When user clicks on the Helm Chart card on the +Add page
    And user searches for the 'Node-ex-k' helm chart
    And user clicks on the 'Node-ex-k' helm chart card
    And user clicks on the Install Helm Chart button
    And user selects the Form View
    And user enters a Release name
    And user clicks on the Install button
    Then user is redirected to Topology page
    And Topology page have the helm chart workload


@regression
Scenario: Install Helm Chart from Developer Catalog Page using YAML View: HR-03-TC01
    Given user is at +Add page
    When user clicks on the Developer Catalog card on the +Add page
    And user checks the Helm Charts checkbox
    And user searches for the 'Node-ex-k' helm chart
    And user clicks on the 'Node-ex-k' helm chart card
    And user clicks on the Install Helm Chart button
    And user selects the YAML View
    And user clicks on the Install button
    Then user is redirected to Topology page
    And Topology page have the helm chart workload


@regression, @smoke, @manual
Scenario: Switch from YAML to Form view
    Given user is at the Install Helm Chart page
    When user selects the YAML View
    And user does some changes in the yaml for helm chart
    And user selects the Form view
    And user comes back to YAML view
    Then user will see that the data hasn't lost


@regression, @smoke, @manual
Scenario: Switch from Form to YAML view
    Given user is at the Install Helm Chart page
    When user selects the Form View
    And user will see values and choices are pulled from JSON Schema associated with chart
    And user does some changes in the form for helm chart
    And user selects the YAML view
    And user comes back to Form view
    Then user will see that the data hasn't lost


@regression, @smoke
Scenario: Perform Upgrade action on Helm Release from Helm release page using Form view
    Given user is at Helm page
    When user opens the kebab menu for the helm release
    And user clicks on the Upgrade action
    And user selects the Form view
    And user updates the chart Version
    And user clicks on the upgrade button
    Then the helm release should get upgradaed
    And user gets redirected to topology page


@regression, @smoke
Scenario: Perform Upgrade action on Helm Release from Helm release page using YAML view
    Given user is at Helm page
    When user opens the kebab menu for the helm release
    And user clicks on the Upgrade action
    And user selects the YAML view
    And user updates the chart Version
    And user clicks on the upgrade button
    Then the helm release should get upgradaed
    And user gets redirected to topology page


@regression, @smoke, @manual
Scenario: When Helm chart doesn't have a JSON schema and cannot generate dynamic form
    Given user is at +Add page
    When user clicks on the Helm Chart card on the +Add page
    And user searches for the helm chart
    And user clicks on the 'Node-ex-k' helm chart card
    Then user sees that Helm chart install page have only YAML view