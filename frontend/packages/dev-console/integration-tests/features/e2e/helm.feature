@e2e
Feature: Helm Chart E2E
              As a user, I should be able to perform end to end scenarios related to Helm Chart


        Background:
            Given user is at developer perspective
              And user has selected namespace "aut-helm-e2e"


        @to-do
        Scenario: Helm Scenarios: EE-01-TC01
            Given user has created helm chart "Nodejs" from Add Page
             When user navigates to Helm Page
              And user navigates to Topology page
              And user opens the Sidebar for Helm Chart "nodejs"
              And user upgrades Helm Chart "nodejs"
              And user uninstalls the Helm Chart "nodejs"
             Then user will not see Helm Chart "nodejs" in Topology page
              And user will not see Helm Chart in helm page
