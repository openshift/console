Feature: Helm Chart E2E 
    As a user, I should be able to perform end to end scenarios related to Helm Chart


Background:
    Given user is at developer perspective
    And user has selected namespace "aut-helm-e2e"


@e2e
Scenario: Helm Scenarios
    Given user has created helm chart "Nodejs Ex K v0.2.1" from Add Page
    When user navigates to Helm Page
    And user navigates to Topology page
    And user opens the Sidebar for Helm Chart "nodejs-ex-k"
    And user upgrades Helm Chart "nodejs-ex-k"
    And user uninstalls the Helm Chart "nodejs-ex-k"
    Then user will not see Helm Chart "nodejs-ex-k" in Topology page
    And user will not see Helm Chart in helm page
