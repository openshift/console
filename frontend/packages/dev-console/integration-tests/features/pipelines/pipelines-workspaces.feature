@pipelines
Feature: Workspaces
              As a user, I want to add or remove secrets details to pipeline

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-pipelines-workspaces"
              And user is at pipelines page


        @smoke
        Scenario: Create the pipeline with workspace from yaml view : P-12-TC01
            Given user is at Edit Yaml page
             When user fills the yaml editor with sample "s2i-build-and-deploy-pipeline-using-workspace"
        # When user enters yaml content "pipeline-with-workspace.yaml" in editor
              And user clicks on create button in Edit Yaml file
             Then user will be redirected to Pipeline Details page with header name "s2i-build-and-deploy"


        @regression
        Scenario: Types of volume present in shared workspace : P-12-TC02
            Given user created pipeline with workspace
              And user is at pipelines page
             When user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
              And user selects shared workspaces drop down
             Then user is able to see different shared workspaces like Empty Directory, Config Map, Secret, PVC


        @regression
        Scenario Outline: Start the pipeline with "<volume_tyoe>" : P-12-TC03
            Given user created pipeline with workspace
             When user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
              And user fills the Parameters in Start Pipeline modal
              And user selects volume type "<volume_tyoe>" from workspaces dorp down
              And user selects Start button
             Then user will be redirected to Pipeline Run Details page

        Examples:
                  | volume_tyoe     |
                  | Empty Directory |


        Scenario: Start the pipeline with ConfigMap : P-12-TC04
            Given user created pipeline with workspace
              And user created Config Map using yaml "pipeline-configMap.yaml"
             When user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
              And user enters first param as "param-1"
              And user selects volume type "Config Map" from workspaces dorpdown
              And user selects "sensitive-recipe-storage" from Config Map drop down
              And user selects Start button
             Then user will be redirected to Pipeline Run Details page


        Scenario: Start the pipeline with Secret : P-12-TC05
            Given user created pipeline with workspace
              And user created Secret using yaml "pipeline-secret.yaml"
             When user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
              And user enters first param as "param-1"
              And user selects volume type "Secret" from shared workspaces dorpdown
              And user selects "secret-password" from Secret drop down
              And user selects Start button
             Then user will be redirected to Pipeline Run Details page


        Scenario: Start the pipeline with PVC : P-12-TC06
            Given user created pipeline with workspace
              And user created Secret using yaml "pipeline-secret.yaml"
             When user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
              And user enters first param as "param-1"
              And user selects volume type "PVC" from shared workspaces dorpdown
              And user selects "shared-task-storage" from PVC drop down
              And user selects Start button
             Then user will be redirected to Pipeline Run Details page
