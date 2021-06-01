@pipelines
Feature: Perform the actions on Pipelines page
              As a user, I want to view pipeline details, create, edit and delete the pipeline from Pipelines page

        Background:
            Given user has created or selected namespace "aut-pipelines"
              And user is at pipelines page


        @smoke
        Scenario Outline: Pipelines Details page: P-06-TC01
            Given pipeline "<pipeline_name>" is present on Pipelines page
             When user clicks pipeline name "<pipeline_name>" on Pipelines page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"
              And user is able to see Details, Metrics, YAML, Pipeline Runs, Parameters and Resources tabs
              And Details tab is displayed with field names Name, Labels, Annotations, Created At, Owner and Tasks
              And Actions dropdown display in the top right corner of the page

        Examples:
                  | pipeline_name |
                  | pipelines-bbb |


        @smoke
        Scenario Outline: Pipelines page display on newly created pipeline: P-06-TC02
            Given pipeline "<pipeline_name>" is present on Pipelines page
             When user searches pipeline "<pipeline_name>" in pipelines page
             Then pipelines table displayed with column names Name, Last Run, Task Status, Last Run Status and Last Run Time
              And column Name display with value "<pipeline_name>"
              And columns Last Run, Task Run Status, Last Run Status, Last Run Time with values display "-"
              And Create Pipeline button is enabled
              And kebab menu button is displayed

        Examples:
                  | pipeline_name |
                  | pipelines-aaa |


        @regression
        Scenario: Kebab menu options of newly created pipeline in Pipelines page: P-06-TC03
            Given pipeline "pipelines-zzz" is present on Pipelines page
             When user searches pipeline "pipelines-zzz" in pipelines page
              And user clicks kebab menu for the pipeline "pipelines-zzz"
             Then kebab menu displays with options Start, Add Trigger, Edit Pipeline, Delete Pipeline


        @regression
        Scenario: Kebab menu options of pipeline with atleast one pipeline run in Pipelines page: P-06-TC04
            Given pipeline run is displayed for "pipelines-yyy" with resource
             When user clicks kebab menu for the pipeline "pipelines-yyy"
             Then user will see "Start Last Run" under Kebab menu


        @regression
        Scenario: Actions menu of newly created pipeline in Pipeline Details page: P-06-TC05
            Given user is at pipeline details page with newly created pipeline "pipelines-rrr"
             When user clicks Actions menu in pipeline Details page
             Then Actions menu display with options Start, Add Trigger, Edit Pipeline, Delete Pipeline


        Scenario Outline: Details of completed pipeline run: P-06-TC06
            Given pipeline run is available for "<pipeline_name>"
             When user clicks pipeline run of pipeline "<pipeline_name>"
             Then Pipeline run details page is displayed
              And pipeline run status displays as "<pipeline_status>" in Pipeline run page
              And Last run status of the "<pipeline_name>" displays as "<pipeline_status>" in pipelines page

        Examples:
                  | pipeline_name | pipeline_status |
                  | nodejs-ez-git | Succeeded       |


        @smoke
        Scenario Outline: Edit the Pipeline from pipelines Details page: P-06-TC07
            Given pipeline "<pipeline_name>" is present on Pipelines page
             When user searches pipeline "<pipeline_name>" in pipelines page
              And user clicks pipeline "<pipeline_name>" from searched results on Pipelines page
              And user selects option "Edit Pipeline" from Actions menu drop down
             Then user redirects to Pipeline Builder page
              And Name field will be disabled
              And Add Parameters, Add Resources, Task should be displayed

        Examples:
                  | pipeline_name |
                  | pipelines-ccc |


        Scenario Outline: Add the task by editing the pipeline: P-06-TC08
            Given pipeline "<pipeline_name>" is present on Pipelines page
             When user selects "Edit Pipeline" option from kebab menu of "<pipeline_name>"
              And user adds another task "openshift-client" in parallel
              And user clicks save on edit pipeline page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name |
                  | pipelines-ddd |


        @smoke
        Scenario Outline: Delete the Pipeline from pipelines Details page: P-06-TC09
            Given pipeline "<pipeline_name>" is present on Pipelines page
             When user searches pipeline "<pipeline_name>" in pipelines page
              And user clicks pipeline "<pipeline_name>" from searched results on Pipelines page
              And user selects option "Delete Pipeline" from Actions menu drop down
              And user clicks Delete button on Delete Pipeline modal
             Then user will be redirected to Pipelines page
              And "<pipeline_name>" is not displayed on Pipelines page

        Examples:
                  | pipeline_name |
                  | pipelines-eee |


        @regression
        Scenario: Delete the Pipeline from pipelines page: P-06-TC10
            Given pipeline "p-run-one" is present on Pipelines page
             When user selects "Delete Pipeline" from the kebab menu for "p-run-one"
              And user clicks Delete button on Delete Pipeline modal
             Then user will be redirected to Pipelines page


        @regression
        Scenario: Edit the Pipeline from pipelines page: P-06-TC11
            Given pipeline "p-run-two" is present on Pipelines page
             When user selects "Edit Pipeline" from the kebab menu for "p-run-two"
             Then user is at the Pipeline Builder page
              And Name field will be disabled
              And Add Parameters, Add Resources, Task should be displayed


        @smoke
        Scenario Outline: Start the basic pipeline from pipelines page: P-06-TC12
            Given pipeline "<pipeline_name>" is present on Pipelines page
             When user selects "Start" from the kebab menu for "<pipeline_name>"
             Then user will be redirected to Pipeline Run Details page

        Examples:
                  | pipeline_name  |
                  | pipe-with-task |


        @regression
        Scenario: Start Last Run for the basic pipeline from pipelines page: P-06-TC13
            Given pipeline run is displayed for "pipeline-fff" with resource
             When user selects "Start last run" from the kebab menu for "pipeline-fff"
             Then user will be redirected to Pipeline Run Details page


        @odc-3991
        Scenario: Edit the workspace name for pipeline from pipelines page: P-06-TC14
            Given pipeline "pipe-edit-wp" is created with "git-wp" workspace
             When user selects "Edit Pipeline" from the kebab menu for "pipe-edit-wp"
              And user edits the Workspace name as "git-opt"
              And user selects the "git-clone" node
              And user selects the "git-opt" workspace in the Output of Workspaces in cluster task sidebar
              And user clicks Save button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipe-edit-wp"
              And user will see workspace mentioned as "git-opt" in the Workspaces section of Pipeline Details page


        @odc-3991
        Scenario: Update the pipeline workspace as optional from pipelines page: P-06-TC15
            Given pipeline "pipe-edit-wp-op" is created with "git-wp" workspace
             When user selects "Edit Pipeline" from the kebab menu for "pipe-edit-wp-op"
              And user clicks on Optional Workspace checkbox
              And user clicks Save button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipe-edit-wp-op"
              And user will see workspace mentioned as "git-wp (optional)" in the Workspaces section of Pipeline Details page
