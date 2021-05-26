@topology
Feature: Topology Toolbar Filter Group
              As a user, I should be able to use the Filter Groups on Topology page

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-tp-toolbar"
              And user is at Add page

        @regression
        Scenario: Topology filter by resource: T-13-TC01
            Given user has created workload "nodejs-ex-git-dc" with resource type "Deployment Config"
             When user clicks on List view button
              And user clicks the filter by resource on top
             Then user will see Deployment and DeploymentConfig options with 1 associated with it
              And user clicks on Deployment checkbox to see only the deployment type workload
              And user clicks on DeploymentConfig checkbox to see only the deploymentconfig type workload
