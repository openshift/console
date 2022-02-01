@pipelines
Feature: Entire pipeline flow from Builder page
              As a user, I want to perform operations on pipeline like Creation, Execution and Deletion


        @pre-condition
        Scenario: Background Steps
            Given user has created or selected namespace "pipeline-flow"


        @smoke
        Scenario: Create a pipeline from pipeline builder page
            Given user is at Pipeline Builder page
             When user enters pipeline name as "flow"
              And user clicks Add task button under Tasks section
              And user searches "git-clone" in quick search bar
              And user selects "git-clone" from git community
              And user clicks on Install and add button
              And user clicks the "git-clone" node
              And user enters the url as "https://github.com/sclorg/golang-ex.git" under Parameters section in cluster task sidebar
              And user enters revision as "master" under Parameters section in cluster task sidebar
              And user adds the parameter details like Name, Description and Default Value
              And user clicks on Add workspace
              And user adds the Workspace name as "git"
              And user clicks the "git-clone" node
              And user selects the "git" workspace in the Output of Workspaces in cluster task sidebar
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "flow"
              And user will see workspace mentioned as "git" in the Workspaces section of Pipeline Details page

        @to-do
        Scenario: Pipelines page details
            Given user is at pipelines page
             When user searches pipeline "flow" in pipelines page
             Then pipelines table displayed with column names Name, Last Run, Task Status, Last Run Status and Last Run Time
              And pipelines column Name display with value "flow"
              And columns Last Run, Task Run Status, Last Run Status, Last Run Time with values display "-"
            #   If pipeline as code is installed, then below step is not applicable
            #   And Create Pipeline button is enabled
              And kebab menu contains options Start, Add Trigger, Edit Pipeline, Delete Pipeline

        @to-do
        Scenario: Pipelines Details page
            Given user is at pipelines page
             When user clicks pipeline name "flow" on Pipelines page
             Then user will be redirected to Pipeline Details page with header name "flow"
              And user is able to see Details, Metrics, YAML, Pipeline Runs, Parameters and Resources tabs
              And Details tab is displayed with field names Name, Labels, Annotations, Created At, Owner and Tasks
              And Actions dropdown display in the top right corner of the page
              And Actions menu contains options Start, Add Trigger, Edit Pipeline, Delete Pipeline

        @to-do
        Scenario: Add the task by editing the pipeline
            Given user is at pipelines page
             When user selects "Edit Pipeline" option from kebab menu of "flow"
             When user adds parallel task "openshift-client"
              And user clicks save on edit pipeline page
             Then user will be redirected to Pipeline Details page with header name "flow"

        @to-do
        Scenario: Start the pipeline with workspace
            Given user is at pipelines page
             When user selects "Start" option from kebab menu for pipeline "flow"
              And user navigates to Workspaces section
              And user selects "VolumeClaimTemplate" option from workspace dropdown
              And user clicks Show VolumeClaimTemplate options
              And user selects StorageClass as "gp2"
              And user clicks on Start
             Then user will be redirected to Pipeline Run Details page
              And user is able to see the pipelineRuns with status as Succeeded
              And user will see VolumeClaimTemplate Workspace in Pipeline Run Details page

        @to-do
        Scenario: Pipeline Run Details page
            Given user is at pipelines page
             When user clicks Last Run value of the pipeline "flow"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see Details, YAML, TaskRuns, Logs and Events tabs
              And Details tab is displayed with field names Name, Labels, Annotations, Created At, Owner and Pipelines
              And user is able to see the pipelineRuns with status as Succeeded
              And Actions menu contains options "Rerun", "Delete PipelineRun"

        @to-do
        Scenario: Rerun the Pipeline Run from pipeline runs page: P-07-TC07
            Given user is at pipelines page
             When user selects the Pipeline Run for "flow"
              And user navigates to Pipeline runs page
              And user selects Rerun option from kebab menu of "flow"
             Then user will remain on pipeline runs page

        @to-do
        Scenario: Add secret to pipeline with authentication type as Basic Authentication: P-08-TC02
            Given user is at Start Pipeline modal for pipeline "flow"
             When user clicks on Show Credentials link present in Start Pipeline modal
              And user clicks on Add Secret link
              And user enters Secret Name as "basic-secret"
              And user selects the "Git Server" option from accessTo drop down
              And user enters the server url as "https://github.com"
              And user selects the Authentication type as "Basic Authentication"
              And user enters the Username, Password as "user", "password"
              And user clicks on tick mark
             Then "basic-secret" is added under secrets section

        @to-do
        Scenario: Add trigger to the pipeline: P-09-TC02
            Given user is at pipelines page
             When user selects "Add Trigger" from the kebab menu for "flow"
              And user selects the "github-pullreq" from Git Provider Type field
              And user clicks on Add button present in Add Trigger modal
             Then pipelines page is displayed
              And "Remove Trigger" is displayed in kebab menu for "flow"

        @to-do
        Scenario: Remove the trigger from pipelines page: P-09-TC08
            Given user is at pipelines page
             When user selects "Remove Trigger" from the kebab menu for "flow"
              And user selects the first option from the Trigger Template drop down field
              And user clicks on Remove button
             Then option "Remove Trigger" is not available in kebab menu for "flow"

        @to-do
        Scenario: Delete the Pipeline Run
            Given user is at pipelines page
             When user selects the Pipeline Run for "flow"
              And user navigates to Pipeline runs page
              And user selects Delete PipelineRun option from kebab menu of "flow"
              And user clicks Delete button present in Delete PipelineRun modal
             Then page will be redirected to pipeline runs page
              And pipeline run is deleted from pipeline runs page

        @to-do
        Scenario: Delete the Pipeline from pipelines page: P-06-TC10
            Given user is at pipelines page
             When user selects "Delete Pipeline" from the kebab menu for "flow"
              And user clicks Delete button on Delete Pipeline modal
             Then user will be redirected to Pipelines page
