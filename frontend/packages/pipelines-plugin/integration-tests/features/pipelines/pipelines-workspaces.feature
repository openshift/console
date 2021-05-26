@pipelines
Feature: Workspaces
              As a user, I want to add or remove secrets details to pipeline

        Background:
            Given user has created or selected namespace "aut-pipelines"
              And user is at pipelines page


        @smoke
        Scenario: Create the pipeline with workspace from yaml view: P-10-TC01
            Given user is at Edit Yaml page
             When user fills the yaml editor with sample "s2i-build-and-deploy-pipeline-using-workspace"
              And user clicks on create button in Edit Yaml file
             Then user will be redirected to Pipeline Details page with header name "s2i-build-and-deploy"


        @regression
        Scenario: Types of volume present in shared workspace: P-10-TC02
            Given user created pipeline with workspace
              And user is at pipelines page
             When user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
              And user selects shared workspaces dropdown
             Then user is able to see different shared workspaces like Empty Directory, Config Map, Secret, PVC


        @regression @odc-3991
        Scenario: Start the pipeline with "Empty Directory": P-10-TC03
            Given pipeline "test-wp-pipeline" is created with workspace
             When user selects "Start" option from kebab menu for pipeline "test-wp-pipeline"
              And user selects volume type "Empty Directory" from workspaces dropdown
              And user clicks on Start
             Then user will be redirected to Pipeline Run Details page
              And user will see "Empty Directory" in the Workspace Resources section of Pipeline Run Details page


        @odc-3991
        Scenario: Start the pipeline with ConfigMap: P-10-TC04
            Given user created pipeline "test-configmap-pipeline" with workspace
              And user created Config Map using yaml "pipeline-configMap.yaml"
             When user selects "Start" option from kebab menu for pipeline "test-configmap-pipeline"
              And user selects volume type "Config Map" from workspaces dropdown
              And user selects "sensitive-recipe-storage" from Config Map dropdown
              And user selects Start button
             Then user will be redirected to Pipeline Run Details page
              And user will see Config Map Workspace "sensitive-recipe-storage" mentioned in the Workspace Resources section of Pipeline Run Details page


        @odc-3991
        Scenario: Start the pipeline with Secret: P-10-TC05
            Given user created pipeline "test-secret-pipeline" with workspace
              And user created Secret using yaml "pipeline-secret.yaml"
             When user selects "Start" option from kebab menu for pipeline "test-secret-pipeline"
              And user selects volume type "Secret" from workspaces dropdown
              And user selects "secret-password" from Secret dropdown
              And user selects Start button
             Then user will be redirected to Pipeline Run Details page
              And user will see Secret Workspace "secret-password" mentioned in the Workspace Resources section of Pipeline Run Details page


        @odc-3991
        Scenario: Start the pipeline with PVC: P-10-TC06
            Given user created pipeline "test-pvc-pipeline" with workspace
              And user created PVC using yaml "pipeline-persistentVolumeClaim.yaml"
             When user selects "Start" option from kebab menu for pipeline "test-pvc-pipeline"
              And user selects volume type "PersistentVolumeClaim" from workspaces dropdown
              And user selects "shared-task-storage" from PVC dropdown
              And user selects Start button
             Then user will be redirected to Pipeline Run Details page
              And user will see PVC Workspace "shared-task-storage" mentioned in the Workspace Resources section of Pipeline Run Details page
