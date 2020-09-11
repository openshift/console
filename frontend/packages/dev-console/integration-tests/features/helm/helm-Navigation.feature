Feature: Navigations on Helm Chart
    As a user, I want to navigate to different pages related to Helm Charts

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-helm-navigation"


@regression, @smoke
Scenario: Open the Helm tab on the navigation bar when helm charts are absent: HR-11-TC02
    Given user is at developer perspecitve
    When user clicks on the Helm tab
    Then user will be redirected to Helm releases page
    And user is able to see the message as no helm charts present
    And user will get the link to install helm charts from developer catalog


@regression, @smoke
Scenario: Install Helm Chart page: HR-02-TC04
    Given user is at Add page
    When user clicks on the Helm Chart card on the Add page
    And user searches for the "Nodejs Ex K v0.2.0" helm chart
    And user clicks on the "Nodejs Ex K v0.2.0" helm chart card
    And user clicks on the Install Helm Chart button on side bar
    Then Install Helm Chart page is displayed
    And release name displays as "nodejs-ex-k"


@regression, @smoke
Scenario: Yaml view editor for Install Helm Chart page: HR-02-TC05
    Given user is at Install Helm Chart page
    When user selects YAML view
    Then user is able to see YAML editor


@regression, @smoke
Scenario: Install Helm Chart: HR-02-TC01, HR-02-TC03, HR-02-TC06
    Given user is at Add page
    When user clicks on the Helm Chart card on the Add page
    And user searches for the "Nodejs Ex K v0.2.0" helm chart
    And user clicks on the "Nodejs Ex K v0.2.0" helm chart card
    And user clicks on the Install Helm Chart button on side bar
    And user clicks on the Install button
    Then user will be redirected to Topology page
    And Topology page have the helm chart workload "nodejs-example"


@regression, @smoke
Scenario: Open the Helm tab on the navigation bar when helm charts are present: HR-11-TC01
    Given helm chart is installed
    When user clicks on the Helm tab
    Then user will be redirected to Helm releases page
    And user will see the helm charts listed


@regression
Scenario: Filter out deployed Helm Charts: HR-11-TC02
    Given user is at the Helm page
    When user clicks on the filter drop down
    And user selects checkbox for the Deployed Helm charts
    Then the checkbox for the Deployed Helm chart is checked
    And helm charts with status deployed are listed


@regression
Scenario: Filter out failed Helm Charts: HR-11-TC03
    Given user is at the Helm page
    When user clicks on the filter drop down
    And user selects checkbox for the Failed Helm charts
    Then the checkbox for the Failed Helm chart is checked
    And helm charts with status failed are listed


@regression
Scenario: Filter out other Helm charts : HR-11-TC04
    Given user is at the Helm page
    When user clicks on the filter drop down
    And user selects checkbox for the Other Helm charts
    Then the checkbox for the Other Helm chart is checked
    And helm charts with status other are listed


@regression
Scenario: Select all filters: HR-11-TC05
    Given user is at the Helm page
    When user clicks on the filter drop down 
    And user selects checkbox for the Deployed Helm charts
    And user selects checkbox for the Failed Helm charts
    And user selects checkbox for the Other Helm charts
    Then the checkbox for the Deployed Helm chart is checked
    And the checkbox for the Failed Helm chart is checked
    And the checkbox for the Other Helm chart is checked


@regression
Scenario: Clear all filters: HR-11-TC06
    Given user has selected all filters
    When user clicks on the clear all filters button
    Then all filters selected will get removed


@regression
Scenario: Search for the Helm Chart: HR-11-TC07
    Given user is at the Helm page
    When user searches for a helm chart "Nodejs Ex K v0.2.0"
    Then the helm chart "Nodejs Ex K v0.2.0" will be shown


Scenario: Search for the not available Helm Chart
    Given user is at the Helm page
    When user searches for a helm chart "Nodejs Ex K v0.10.0"
    # Then user is able to see message on the Helm page as "message" - update message


@regression, @smoke
Scenario: Helm release details page : HR-11-TC08
    Given user is at the Helm page with one helm release
    When user clicks on the helm release name "nodejs-ex-k"
    Then user will see the Details page opened
    And user will see the Resources tab
    And user will see the Revision History tab
    And user will see the Release Notes tab
    And user will see the Actions drop down menu


Scenario: Actions menu of Helm Details page : P-03-TC10
   Given user is at the Helm page
   When user clicks Actions menu in Helm Details page
   Then Actions menu display with options Upgrade, Rollback, and Uninstall Helm Release
