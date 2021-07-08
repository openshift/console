@topology
Feature: Deleteing an application node
              As a user, I want to delete an application

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-delete-workload"
              And user is at Add page


        @regression
        Scenario: Deleting a workload through Action menu: T-15-TC01
            Given user has created workload "nodejs-ex-git-d" with resource type "Deployment"
             When user clicks on workload "nodejs-ex-git-d"
              And user clicks on Action menu
              And user clicks "Delete Deployment" from action menu
              And user clicks on Delete button from modal
             Then user will see workload disappeared from topology


        @regression
        Scenario: Deleting a workload through context menu: T-15-TC02
            Given user has created workload "nodejs-ex-git-dc" with resource type "Deployment Config"
             When user right clicks on the workload "nodejs-ex-git-dc" to open the Context Menu
              And user clicks "Delete DeploymentConfig" from action menu
              And user clicks on Delete button from modal
             Then user will see workload disappeared from topology
