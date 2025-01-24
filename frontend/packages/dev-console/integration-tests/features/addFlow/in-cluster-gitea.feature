@add-flow @dev-console
Feature: Create Application from git form with repositories from In cluster Gitea Server
              As a user, I want to create the application from git form with repositories from In cluster Gitea Server

        Background:
            Given user has installed Gitea Server with pre-loaded repositories
              And user is at developer perspective
              And user has created or selected namespace "aut-addflow-gitea"
              And user is at Add page
        
        @regression @odc-7581
        Scenario Outline: Add new gitea workload with new application for resource type "<resource_type>": A-06-TC01
            Given user is at Import from Git form
             When user enters Gitea Repo Name as "nodejs"
              And user enters Application name as "nodejs-git-app"
              And user enters Name as "<name>"
              And user selects resource type as "<resource_type>"
              And user clicks Create button on Add page
             Then user can see toast notification saying "<resource_type>" created successfully
              And user will be redirected to Topology page
              And user is able to see workload "<name>" in topology page
              And user deletes the Gitea Server

        Examples:
                  | name       | resource_type |
                  | import-git | Deployment    |


        @regression @odc-7581
        Scenario Outline: Create a workload from Docker file with "<resource_type>" as resource type: A-05-TC02
            Given user is at Import from Git form
             When user enters Gitea Repo Name as "dockerfile-node"
              And user enters Name as "<name>" in Docker file page
              And user selects "<resource_type>" in Resource type section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<name>" in topology page
              And user deletes the Gitea Server

        Examples:
                  | resource_type | name       |
                  | Deployment    | dockerfile |