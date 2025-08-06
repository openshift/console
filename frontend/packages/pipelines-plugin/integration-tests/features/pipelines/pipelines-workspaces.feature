@pipelines
Feature: Workspaces
              As a user, I want to add or remove secrets details to pipeline

        Background:
            Given user has created or selected namespace "aut-pipelines"
              And user is at pipelines page in developer view


        @smoke @broken-test
        # Sidebar do not have samples present https://issues.redhat.com/browse/SRVKP-3199
        Scenario: Create the pipeline with workspace from yaml view: P-10-TC01
            Given user is at Edit Yaml page
             When user fills the yaml editor with sample "s2i-build-and-deploy-pipeline-using-workspace"
              And user clicks on create button in Edit Yaml file
             Then user will be redirected to Pipeline Details page with header name "s2i-build-and-deploy"


        @regression
        Scenario: Types of volume present in shared workspace: P-10-TC02
            Given user created pipeline with workspace using yaml "testData/pipelines-workspaces/s2i-build-and-deploy-pipeline-using-workspace.yaml"
              And user is at pipelines page in developer view
             When user selects "Start" option from kebab menu for pipeline "s2i-build-and-deploy-workspace"
              And user selects shared workspaces dropdown
             Then user is able to see different shared workspaces like Empty Directory, Config Map, Secret, PVC, VolumeClaimTemplate


        @regression
        Scenario: Start the pipeline with "Empty Directory": P-10-TC03
            Given user created pipeline "test-wp-pipeline" with workspace
             When user selects "Start" option from kebab menu for pipeline "test-wp-pipeline"
              And user selects volume type "Empty Directory" from workspaces dropdown
              And user clicks on Start
             Then user will be redirected to Pipeline Run Details page
              And user will see "Empty Directory" in the Workspace Resources section of Pipeline Run Details page


        @regression
        Scenario: Start the pipeline with ConfigMap: P-10-TC04
            Given user created Config Map using yaml "configMap-test-motd.yaml"
              And user created pipeline run using yaml "pipelineRun-using-optional-workspaces-in-when-expressions.yaml"
             When user is at PipelineRun Details Page of "optional-workspace-when-"
              And user selects "rerun" option from action menu for pipeline run "optional-workspace-when-"
             Then user will see Config Map Workspace "test-motd" mentioned in the Workspace Resources section of Pipeline Run Details page


        @regression
        Scenario: Start the pipeline with Secret: P-10-TC05
            Given user created pipeline "test-secret-pipeline" with workspace
              And user created Secret using yaml "pipeline-secret.yaml"
              And user is at pipelines page in developer view
             When user selects "Start" option from kebab menu for pipeline "test-secret-pipeline"
              And user selects volume type "Secret" from workspaces dropdown
              And user selects "secret-password" from Secret dropdown
              And user selects Start button
             Then user will be redirected to Pipeline Run Details page
              And user will see Secret Workspace "secret-password" mentioned in the Workspace Resources section of Pipeline Run Details page


        @regression
        Scenario: Start the pipeline with PVC: P-10-TC06
            Given user created pipeline "test-pvc-pipeline" with workspace
              And user created PVC using yaml "pipeline-persistentVolumeClaim.yaml"
              And user is at pipelines page in developer view
             When user selects "Start" option from kebab menu for pipeline "test-pvc-pipeline"
              And user selects volume type "PersistentVolumeClaim" from workspaces dropdown
              And user selects "shared-task-storage" from PVC dropdown
              And user selects Start button
             Then user will be redirected to Pipeline Run Details page
              And user will see PVC Workspace "shared-task-storage" mentioned in the Workspace Resources section of Pipeline Run Details page
