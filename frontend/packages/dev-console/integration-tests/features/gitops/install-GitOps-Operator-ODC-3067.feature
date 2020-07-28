Feature: Install GitOps Service Operator
    User should be able to install the GitOps Service Operator


Background: 
    Given user is at the Administrator perspective


@regression
Scenario: Install GitOps Operator
    Given user is at OperatorHub
    When user searches for GitOps Service Operator
    And user clicks on the GitOps Service card
    And user clicks on the install button
    And user clicks on install GitOps Operator button
    Then user will see that GitOps Service Operator is installed


@regression
Scenario: Create GitOps Service
    Given user has installed GitOps Operator
    When user switches to openshift-pipelines-app-delivery namespace
    And user goes to Installed Operator page
    And user clicks on GitOps Service Operator
    And user clicks on GitOps Service tab
    And user clicks on Create GitOps Service
    And user clicks on Create button
    Then user will see that new Service has been created


@regression
Scenario: GitOps Nav Item
    Given user has installed GitOps Operator
    And user is at Developer perspective
    Then user will see the GitOps Nav Item
