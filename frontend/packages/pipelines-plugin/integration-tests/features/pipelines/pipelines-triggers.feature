@pipelines
Feature: Triggers
              As a user, I want to add or remove trigger details and verify the trigger for the git web hooks from pipeline

        Background:
            Given user has created or selected namespace "aut-pipelines"
              And user is at pipelines page


        @regression
        Scenario: Variables section in Add Trigger modal details: P-09-TC01
            Given user has created pipeline "pipe-trigger-one" with git resources
              And user selected Add Trigger from kebab menu of pipeline "pipe-trigger-one"
             When user selects the "github-pullreq" from Git Provider Type field
              And user clicks on "Show Variables" link
             Then Git provider type field is enabled
              And user should be able to see "Hide Variables" link with variables section
              And variables section displayed with message "The following variables can be used in the Parameters or when created new Resources."
              And Add button is disabled


        @smoke
        Scenario Outline: Add the trigger to the pipeline with resource from pipelines page: P-09-TC02
            Given user has created pipeline "<pipeline_name>" with git resources
             When user selects "Add Trigger" from the kebab menu for "<pipeline_name>"
              And user selects the "github-pullreq" from Git Provider Type field
              And user enters git url as "https://github.com/sclorg/nodejs-ex.git" in add trigger modal
              And user enters revision as "master" in add trigger modal
              And user clicks on Add button present in Add Trigger modal
             Then pipelines page is displayed
              And "Remove Trigger" is displayed in kebab menu for "<pipeline_name>"

        Examples:
                  | pipeline_name |
                  | trigger-two   |


        @smoke
        Scenario Outline: Pipeline Trigger template display in pipeline details page: P-09-TC03
            Given pipeline "<pipeline_name>" with trigger in pipelines page
             When user clicks pipeline "<pipeline_name>"
             Then pipeline Details page is displayed with header name "<pipeline_name>"
              And Trigger Templates section is displayed

        Examples:
                  | pipeline_name |
                  | trigger-three |


        @regression
        Scenario: Trigger template details page: P-09-TC04
            Given pipeline "git-pipeline" with trigger in pipelines page
              And user is at pipeline Details page of pipeline "git-pipeline"
             When user clicks on trigger template
             Then user will be redirected to Trigger Template Details page
              And user is able to see Details, YAML tabs
              And Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner, Pipelines and Event Listeners
              And Actions dropdown display on the top right corner of the page


        @regression
        Scenario: Event Listener Details page: P-09-TC05
            Given pipeline "git-pipeline-events" with trigger in pipelines page
              And user is at Trigger Template Details page of pipeline "git-pipeline-events"
             When user clicks on Event listener
             Then user will be redirected to Event Listener Details page
              And user is able to see Details, YAML tabs
              And Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner, Trigger Templates and Trigger Bindings
              And Actions dropdown display on the top right corner of the page


        @regression
        Scenario: Cluster Trigger Binding Details page: P-09-TC06
            Given pipeline "git-pipeline-triggerbinding" with trigger in pipelines page
              And user is at Event Listener Details page of pipeline "git-pipeline-triggerbinding"
             When user clicks on Trigger Binding
             Then user will be redirected to Cluster Trigger Binding Details page
              And user is able to see Details, YAML tabs
              And Details tab is displayed with field names Name, Labels, Annotations, Created At, Owner
              And Actions dropdown display on Cluster Trigger Binding page


        @regression
        Scenario Outline: Remove Trigger modal details: P-09-TC07
            Given pipeline "<pipeline_name>" with trigger in pipelines page
             When user selects "Remove Trigger" from the kebab menu for "<pipeline_name>"
             Then modal is displayed with header message "Remove Trigger"
              And trigger template dropdown displayed with help text Select Trigger Template
              And Remove button will be disabled

        Examples:
                  | pipeline_name |
                  | trigger-four  |


        @smoke
        Scenario Outline: Remove the trigger from pipelines page: P-09-TC08
            Given pipeline "<pipeline_name>" with trigger in pipelines page
             When user selects "Remove Trigger" from the kebab menu for "<pipeline_name>"
              And user selects the first option from the Trigger Template drop down field
              And user clicks on Remove button
             Then option "Remove Trigger" is not available in kebab menu for "<pipeline_name>"

        Examples:
                  | pipeline_name |
                  | trigger-five  |


        @regression @manual
        Scenario: Start the pipeline with secret by updating the git repo: P-09-TC09
            Given pipeline "trigger-six" with trigger in pipelines page
              And user is at pipeline trigger template page for pipeline "trigger-six"
             When user navigates to github repo url
              And user selects webhooks from github settings page
              And user clicks Add Webhook
              And user enters payload url as trigger template url
              And user enters content type as "application/json"
              And user clicks on Add Webhook
              And update the content in ReadMe file
              And user navigates to pipelines page
             Then user is able to see new pipeline run for "trigger-six" in pipelines page


        @regression @manual
        Scenario: Start the pipeline with secret by updating the git repo: P-09-TC10
            Given pipeline "trigger-seven" with trigger in pipelines page
              And user is at pipeline trigger template page for pipeline "trigger-seven"
             When user navigates to github repo url
              And user selects webhooks from github settings page
              And user clicks Add Webhook
              And user enters payload url as trigger template url
              And user enters content type as "application/json"
              And user enters the secret authentication key
              And user clicks on Add Webhook
              And update the content in ReadMe file
              And user navigates to pipelines page
             Then user is able to see new pipeline run for "trigger-seven" in pipelines page


        @smoke @odc-3991
        Scenario Outline: Add the trigger to the pipeline with workspace from pipelines page: P-09-TC11
            Given user created pipeline "<pipeline_name>" with workspace
              And user created PVC using yaml "pipeline-persistentVolumeClaim.yaml"
             When user selects "Add Trigger" from the kebab menu for "<pipeline_name>"
              And user selects the "github-pullreq" from Git Provider Type field
              And user selects volume type "PersistentVolumeClaim" from workspaces dropdown
              And user clicks on Add button present in Add Trigger modal
             Then pipelines page is displayed

        Examples:
                  | pipeline_name  |
                  | pipe-trigger-1 |
