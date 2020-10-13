Feature: Install the Helm Release
    As a user, I want to install the helm release

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-helm-installation"


@regression, @smoke
Scenario: The Helm Chart option on the +Add Page: HR-01-TC01
    Given user is at Add page
    Then user can see Helm Chart card on the Add page


@regression, @smoke
Scenario: Developer Catalog Page when Helm Charts checkbox is selected: HR-01-TC02, HR-02-TC02
    Given user is at Add page
    When user clicks on the Helm Chart card on the Add page
    Then user will get redirected to Developer Catalog page
    And user is able to see Helm Chart option is selected in Developer Catalog page
    And user is able to see Helm Charts cards


@regression
Scenario: Install Helm Chart from Developer Catalog Page using YAML View: HR-03
    Given user is at Add page
    When user clicks on the Developer Catalog card on the Add page
    And user checks the Helm Charts checkbox
    And user searches for the "Nodejs Ex K v0.2.0" helm chart
    And user clicks on the "Nodejs Ex K v0.2.0" helm chart card
    And user clicks on the Install Helm Chart button on side bar
    And user selects YAML view
    And user selects the Chart Version "0.2.1 / App Version 1.16.0 (Provided by Redhat Helm Repo)"
    And user clicks on the Install button
    Then user will be redirected to Topology page
    And Topology page have the helm chart workload "nodejs-ex-k"


@regression, @smoke
Scenario: Install Helm Chart from +Add Page using Form View: HR-02-TC01
    Given user is at Add page
    When user clicks on the Helm Chart card on the Add page
    And user searches for the "Nodejs Ex K v0.2.1" helm chart
    And user clicks on the "Nodejs Ex K v0.2.1" helm chart card
    And user clicks on the Install Helm Chart button on side bar
    And user enters Release Name as "nodejs-example"
    And user clicks on the Install button
    Then user will be redirected to Topology page
    And Topology page have the helm chart workload "nodejs-example"


@regression
Scenario: Chart versions drop down menu
    Given user is at the developer catalog page
    When user checks the Helm Charts checkbox
    And user searches for the 'Nodejs Ex K v0.2.1' helm chart
    And user clicks on the 'Nodejs Ex K v0.2.1' helm chart card
    And user will see the information of all the chart versions together
    And user clicks on the Install Helm Chart button
    Then user will see the chart version dropdown


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
