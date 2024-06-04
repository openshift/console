@topology @ODC7596
Feature: Update user in topology page if PodDisruptionBudget is violated in a namespace
              If any PodDisruptionBudget is violated, a warning alert will be displayed for the user in Topology page.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-pdb"


        @regression
        Scenario: One PodDisruptionBudget is violated: T-20-TC01
            Given user creates PodDisruptionBudget by entering 'testData/poddisruptionbudget/pdb-minAvailable.yaml' file data
             When user navigates to Topology page
              And user clicks on link to view PodDisruptionBudget details
             Then user is redirected to PodDisruptionBudget details page


        @regression
        Scenario: Multiple PodDisruptionBudgets are violated: T-20-TC02
            Given user creates PodDisruptionBudget by entering 'testData/poddisruptionbudget/pdb-maxUnavailable.yaml' file data
             When user navigates to Topology page
              And user clicks on link to view PodDisruptionBudget details
             Then user is redirected to PodDisruptionBudget list page
