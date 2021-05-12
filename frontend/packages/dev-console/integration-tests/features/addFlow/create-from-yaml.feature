@add-flow
Feature: Create Application from YAML file
              As a user, I want to create the application, component or service from Yaml file using Add Flow

        Background:
            Given user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-addflow-yaml"


        @smoke
        Scenario: Create a workload from YAML file: A-07-TC01
            Given user is at Import YAML page
             When user enters the "testData/add-flow/git-dc.yaml" file data to YAML Editor
              And user clicks create button on YAML page
              And user navigates to Topology page
             Then user is able to see workload "shell-app" in topology page


        @regression
        Scenario: Perform cancel operation on YAML file: A-07-TC02
            Given user is at Import YAML page
             When user clicks on cancel button
             Then user will be redirected to Add page
