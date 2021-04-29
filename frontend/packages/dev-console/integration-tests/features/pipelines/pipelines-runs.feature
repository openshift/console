@pipelines
Feature: Pipeline Runs
              As a user, I want to start pipeline, rerun, delete pipeline run

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-pipelines-runs"
              And user is at pipelines page


        @regression
        Scenario Outline: Start pipeline popup details for pipeline with one resource : P-04-TC02
            Given pipeline "<pipeline_name>" consists of task "<task_name>" with one git resource
              And user is at pipelines page
             When user selects "Start" option from kebab menu for pipeline "<pipeline_name>"
             Then Start Pipeline modal displays with Git Resources, Advanced Options sections
              And start button is disabled

        Examples:
                  | pipeline_name         | task_name        |
                  | pipeline-git-resoruce | openshift-client |


        @smoke
        Scenario Outline: Start the pipeline with one resource : P-04-TC03
            Given pipeline "<pipeline_name>" consists of task "<task_name>" with one git resource
              And user is at pipelines page
             When user selects "Start" option from kebab menu for pipeline "<pipeline_name>"
              And user enters git url as "https://github.com/sclorg/nodejs-ex.git" in start pipeline modal
              And user enters revision as "master" in start pipeline modal
              And user clicks Start button in start pipeline modal
             Then user will be redirected to Pipeline Run Details page
              And user is able to see the pipelineRuns with status as "Running"
              And pipeline run details for "<pipeline_name>" display in Pipelines page

        Examples:
                  | pipeline_name | task_name        |
                  | pipe-task     | openshift-client |


        @smoke
        Scenario Outline: Last Run Status of pipeline in pipelines page after starting pipeline Run : P-05-TC01
            Given pipeline run is displayed for "<pipeline_name>" with resource
              And user is at pipelines page
             When user navigates to Pipelines page
             Then Last Run status of the "<pipeline_name>" displays as "Running"

        Examples:
                  | pipeline_name |
                  | pipe-task-1   |


        @smoke
        Scenario Outline: Pipeline Run Details page for pipeline without resource : P-06-TC03
            Given pipeline run is displayed for "<pipeline_name>" without resource
              And user is at pipelines page
             When user clicks Last Run value of "<pipeline_name>"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see Details, YAML, TaskRuns, Logs and Events tabs
              And Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner, Status, Pipeline and Triggered by
              And Actions dropdown display on the top right corner of the page

        Examples:
                  | pipeline_name |
                  | pipeline-run  |


        @regression
        Scenario: Actions on Pipeline Run Details page : P-06-TC06
            Given user is at the Pipeline Run Details page of pipeline "pipeline-run"
             When user clicks Actions menu on the top right corner of the page
             Then Actions menu display with the options "Rerun", "Delete Pipeline Run"


        @regression
        Scenario Outline: Rerun the Pipeline Run from pipeline run details page: P-06-TC01
            Given user is at the Pipeline Run Details page of pipeline "<pipeline_name>"
             When user selects Rerun option from the Actions menu
             Then status displays as "Running" in pipeline run details page

        Examples:
                  | pipeline_name    |
                  | pipeline-rerun-1 |


        @regression
        Scenario Outline: Rerun the Pipeline Run from pipeline runs page : P-06-TC02
            Given pipeline run is displayed for "<pipeline_name>" without resource
              And user is at pipelines page
             When user selects the Pipeline Run for "<pipeline_name>"
              And user selects Rerun option from kebab menu of "<pipeline_name>"
             Then page will be redirected to pipeline runs page

        Examples:
                  | pipeline_name    |
                  | pipeline-rerun-3 |


        @smoke
        Scenario Outline: Pipeline Run Details page for a pipeline with resource : P-06-TC04
            Given pipeline run is displayed for "<pipeline_name>" with resource
              And user is at pipelines page
             When user clicks Last Run value of the pipeline "<pipeline_name>"
             Then user will be redirected to Pipeline Run Details page
              And Pipeline Resources field will be displayed

        Examples:
                  | pipeline_name          |
                  | pipeline-with-resoruce |


        Scenario Outline: Filter the pipeline runs based on status : P-06-TC07
            Given pipeline "<pipeline_name>" is executed for 3 times
              And user is at pipelines page
             When user filters the pipeline runs of pipeline "<pipeline_name>" based on the "<status>"
             Then user is able to see the pipelineRuns with status as "<status>"

        Examples:
                  | pipeline_name             | status    |
                  | pipeline-without-resoruce | Succeeded |


        @smoke
        Scenario: Start the pipeline from Pipeline Details page : P-04-TC04
            Given pipeline "pipeline-zzz-1" is present on Pipeline Details page
             When user selects "Start" option from pipeline Details Actions menu
             Then user will be redirected to Pipeline Run Details page


        @regression, @manual
        Scenario Outline: Download the logs from Pipeline Details page : P-04-TC05
            Given pipeline "pipeline-two" is present on Pipeline Details page
             When user selects "Start" option from kebab menu for pipeline "pipeline-two"
              And user navigates to pipelineRun logs tab
              And user clicks on Download button
             Then user is able to see the downloaded file


        @regression, @manual
        Scenario Outline: Download the logs from Pipeline Details page : P-05-TC06
            Given pipeline run is displayed for "pipe-task-with-resoruce" with resource
             When user navigates to pipelineRun logs tab
              And user clicks on Download button
             Then user is able to see the downloaded file
              And logs contains tasks with details of execution


        @regression, @manual
        Scenario: Expand the logs page: P-04-TC06
            Given pipeline run is displayed for "pipe-task-with-resoruce" with resource
             When user navigates to pipelineRun logs tab
              And user clicks on Expand button
             Then user is able to see expanded logs page


        @regression
        Scenario: kebab menu options in pipeline Runs page : P-04-TC07
            Given pipeline run is displayed for "pipeline-aaa" without resource
             When user selects the Pipeline Run for "pipeline-aaa"
              And user navigates to pipelineRuns page
              And user selects the kebab menu in pipeline Runs page for pipeline "pipeline-aaa"
             Then user is able to see kebab menu options Rerun, Delete Pipeline Run


        @regression
        Scenario: Start LastRun from topology page : P-05-TC04
            Given workload "nodejs-ex-git" is created from add page with pipeline
              And user started the pipeline "nodejs-ex-git" in pipelines page
             When user navigates to Topology page
              And user clicks node "nodejs-ex-git" to open the side bar
              And user selects Start LastRun from topology side bar
             Then user is able to see pipeline run in topology side bar


        @regression
        Scenario: Maximum pipeline runs display in topology page: P-05-TC05
            Given workload "nodejs-ex-git-1" is created from add page with pipeline
              And user is at pipelines page
              And pipeline "nodejs-ex-git-1" is executed for 5 times
             When user clicks node "nodejs-ex-git-1" to open the side bar
             Then side bar is displayed with the pipelines section
              And 3 pipeline runs are displayed under pipelines section of topology page
              And View all link is displayed


        Scenario: Start the pipeline with cancelled tasks: P-07-TC04
            Given user is at the Pipeline Details page
              And pipeline run is available with cancelled tasks for pipeline "pipeline-three"
             When user selects "Start" option from kebab menu for pipeline "pipeline-three"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see the pipelineRuns with status as "Running"


        Scenario: Start the pipeline with failed tasks: P-07-TC05
            Given user is at the Pipeline Details page
              And pipeline run is available with failed tasks for pipeline "pipeline-four"
             When user selects "Start" option from kebab menu for pipeline "pipeline-four"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see the pipelineRuns with status as "Running"


        Scenario: Start the pipeline with successful tasks: P-07-TC06
            Given user is at the Pipeline Details page
              And pipeline run is available with failed tasks for pipeline "pipeline-five"
             When user selects "Start" option from kebab menu for pipeline "pipeline-five"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see the pipelineRuns with status as "Running"


        @smoke
        Scenario Outline: Pipeline status display in topology side bar : P-05-TC02
            Given pipeline "<pipeline_name>" is created from git page
              And user is at pipelines page
             When user selects "Start" option from kebab menu for pipeline "<pipeline_name>"
              And user starts the pipeline from start pipeline modal
              And user navigates to Topology page
             Then Last Run status of the "<pipeline_name>" displays as "Running" in topology page

        Examples:
                  | pipeline_name |
                  | p-sidebar     |


        @regression, @manual
        Scenario: Editing a pipeline structure should not affect the previously executed pipeline runs
            Given user has pipeline with two tasks
              And user is at the Pipeline Details page
              And pipeline run is present
             When user clicks Edit Pipeline from Actions menu
              And user adds a new task in series to the last task present
              And user clicks on save
              And user starts the pipeline
             Then newly created pipeline run contains the new pipeline graph
              And existing pipeline runs contains the old pipeline graph


        @regression
        Scenario: Display failure details on pipeline run details
            Given user is at pipeline page in developer perspective
              And a failed pipeline is present
             When user goes to failed pipeline run
              And user opens pipeline run details
             Then user can see status as Failure
              And user can view failure message under Message heading
              And user can see Log snippet to get know what taskruns failed


        @regression
        Scenario: Display failure details of pipeline run in topology sidebar
            Given user is in topology
              And a node with an associated pipeline that has failed is present
             When user opens sidebar of the node
              And user scrolls down to pipeline runs section
             Then user will see the pipeline run name with failed status
              And user will see failure message below pipeline runs
              And user will also see the log snippet
