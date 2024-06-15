@topology @ODC7596
Feature: Update user in topology page if PodDisruptionBudget is violated in a namespace
              If any PodDisruptionBudget is violated, a warning alert will be displayed for the user in Topology page.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-pdb"


        @regression
        Scenario: PodDisruptionBudget does not match any pod: T-20-TC01
            Given user has created workload with resource type deployment
             When user creates 'my-pdb-1' PodDisruptionBudget by entering 'testData/poddisruptionbudget/pdb-minAvailable.yaml' file data
              And user navigates to Topology page
             Then user should not see PodDisruptionBudget warning message

        @regression
        Scenario: One PodDisruptionBudget is violated: T-20-TC02
            Given user has created workload with resource type deployment
             When user creates 'my-pdb-2' PodDisruptionBudget by entering 'testData/poddisruptionbudget/pdb-minAvailable.yaml' file data
              And user navigates to Topology page
              And user clicks on link to view PodDisruptionBudget details
             Then user is redirected to PodDisruptionBudget details page


        @regression
        Scenario: Multiple PodDisruptionBudgets are violated: T-20-TC03
            Given user has created workload with resource type deployment
             When user creates 'my-pdb-3' PodDisruptionBudget by entering 'testData/poddisruptionbudget/pdb-minAvailable.yaml' file data
              And user navigates to Topology page
              And user clicks on link to view PodDisruptionBudget details
             Then user is redirected to PodDisruptionBudget list page
