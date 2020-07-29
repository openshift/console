Feature: Install GitOps Service Operator
    User should be able to install the GitOps Service Operator


Background: 
    Given user is at the Administrator perspective


@regression
Scenario: Navigation bar when GitOps Operator is not installed
    Given user is at Developer perspective
    Then user will not see GitOps nav Item


@regression
Scenario: Install GitOps Operator
    Given user is at OperatorHub
    When user searches for GitOps Service Operator
    And user clicks on the GitOps Service card
    And user clicks on the install button
    And user clicks on install GitOps Operator button
    Then user will see a modal saying GitOps Service Operator is installed


@regression
Scenario: GitOps Nav Item
    Given user has installed GitOps Operator
    And user is at Developer perspective
    Then user will see the GitOps Nav Item
