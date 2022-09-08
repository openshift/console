@pipelines
Feature: Pipeline Runs
              As a user, I want to start pipeline, rerun, delete pipeline run

        Background:
            Given user has created or selected namespace "aut-pipelines-runs"
              And user is at pipelines page


        @regression
        Scenario Outline: Start pipeline popup details for pipeline with one resource: P-07-TC01
            Given pipeline "<pipeline_name>" consists of task "<task_name>" with one git resource
              And user is at pipelines page
             When user selects "Start" option from kebab menu for pipeline "<pipeline_name>"
             Then Start Pipeline modal displays with Git Resources, Advanced Options sections
              And start button is disabled

        Examples:
                  | pipeline_name         | task_name        |
                  | pipeline-git-resource | openshift-client |


        @smoke
        Scenario Outline: Start the pipeline with one resource: P-07-TC02
            Given pipeline "<pipeline_name>" consists of task "<task_name>" with one git resource
              And user is at pipelines page
             When user selects "Start" option from kebab menu for pipeline "<pipeline_name>"
              And user enters git url as "https://github.com/sclorg/nodejs-ex.git" in start pipeline modal
              And user enters revision as "master" in start pipeline modal
              And user clicks Start button in start pipeline modal
             Then user will be redirected to Pipeline Run Details page
              And user is able to see the pipelineRuns with status as Running
              And pipeline run details for "<pipeline_name>" display in Pipelines page
              And Last Run status of the "<pipeline_name>" displays as "Succeeded"

        Examples:
                  | pipeline_name | task_name        |
                  | pipe-task     | openshift-client |


        @smoke
        Scenario Outline: Pipeline Run Details page for pipeline without resource: P-07-TC04
            Given pipeline run is displayed for "<pipeline_name>" without resource
              And user is at pipelines page
             When user clicks Last Run value of "<pipeline_name>"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see Details, YAML, TaskRuns, Parameters, Logs and Events tabs
              And Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner, Status, Pipeline and Triggered by
              And Actions dropdown display on the top right corner of the page

        Examples:
                  | pipeline_name |
                  | pipeline-run  |


        @regression
        Scenario: Actions on Pipeline Run Details page: P-07-TC05
            Given pipeline run is displayed for "pipeline-rerun-0" without resource
              And user is at the Pipeline Run Details page of pipeline "pipeline-rerun-0"
             When user clicks Actions menu on the top right corner of the page
             Then Actions menu display with the options "Rerun", "Delete PipelineRun"


        @regression
        Scenario Outline: Rerun the Pipeline Run from pipeline run details page: P-07-TC06
            Given pipeline run is displayed for "<pipeline_name>" without resource
              And user is at the Pipeline Run Details page of pipeline "<pipeline_name>"
             When user selects Rerun option from the Actions menu
             Then status displays as "Running" in pipeline run details page

        Examples:
                  | pipeline_name    |
                  | pipeline-rerun-1 |


        @smoke
        Scenario Outline: Rerun the Pipeline Run from pipeline runs page: P-07-TC07
            Given pipeline run is displayed for "<pipeline_name>" without resource
              And user is at pipelines page
             When user selects the Pipeline Run for "<pipeline_name>"
              And user navigates to Pipeline runs page
              And user selects Rerun option from kebab menu of "<pipeline_name>"
             Then page will be redirected to pipeline runs page

        Examples:
                  | pipeline_name    |
                  | pipeline-rerun-2 |


        @smoke
        Scenario Outline: Pipeline Run Details page for a pipeline with resource: P-07-TC08
            Given pipeline run is displayed for "<pipeline_name>" with resource
              And user is at pipelines page
             When user clicks Last Run value of the pipeline "<pipeline_name>"
             Then user will be redirected to Pipeline Run Details page
              And Pipeline Resources field will be displayed

        Examples:
                  | pipeline_name          |
                  | pipeline-with-resource |


        @to-do
        # Marking it as to-do due to flakiness
        Scenario Outline: Filter the pipeline runs based on status: P-07-TC09
            Given pipeline "<pipeline_name>" is executed for 3 times
              And user is at pipelines page
             When user filters the pipeline runs of pipeline "<pipeline_name>" based on the "<status>"
             Then user is able to see the filtered results with pipelineRuns status "<status>"

        Examples:
                  | pipeline_name             | status    |
                  | pipeline-without-resource | Succeeded |


        @smoke
        Scenario: Start the pipeline from Pipeline Details page: P-07-TC10
            Given pipeline "pipeline-zzz" is present on Pipeline Details page
             When user selects "Start" option from pipeline Details Actions menu
             Then user will be redirected to Pipeline Run Details page


        @regression @manual
        Scenario: Download the logs from Pipeline Details page: P-07-TC11
            Given pipeline "pipeline-two" is present on Pipeline Details page
             When user selects "Start" option from kebab menu for pipeline "pipeline-two"
              And user navigates to pipelineRun logs tab
              And user clicks on Download button
             Then user is able to see the downloaded file


        @regression @manual
        Scenario: Download the logs from Pipeline Details page: P-07-TC12
            Given pipeline run is displayed for "pipe-task-with-resource" with resource
             When user navigates to pipelineRun logs tab
              And user clicks on Download button
             Then user is able to see the downloaded file
              And logs contains tasks with details of execution


        @regression @manual
        Scenario: Expand the logs page: P-07-TC13
            Given pipeline run is displayed for "pipe-task-with-resource" with resource
             When user navigates to pipelineRun logs tab
              And user clicks on Expand button
             Then user is able to see expanded logs page


        @regression @odc-4793
        Scenario: kebab menu options in pipeline Runs page: P-07-TC14
            Given user creates pipeline using git named "pipeline-aaa"
              And user is at the Pipeline Details page of pipeline "pipeline-aaa"
            #  When user starts the pipeline from start pipeline modal
             When user starts the pipeline "pipeline-aaa" in Pipeline Details page
              And user clicks Actions menu on the top right corner of the page
             Then user is able to see Actions menu options "Stop", "Cancel", "Rerun", "Delete PipelineRun" in pipeline run page


        @regression
        Scenario: Start LastRun from topology page: P-07-TC15
            Given user created workload "nodejs-last-run" from add page with pipeline
              And user started the pipeline "nodejs-last-run" in pipelines page
             When user navigates to Topology page
              And user clicks node "nodejs-last-run" to open the side bar
              And user selects Start LastRun from topology side bar
             Then user is able to see pipeline run in topology side bar


        @manual
        Scenario: Maximum pipeline runs display in topology page: P-07-TC16
            Given user created workload "nodejs-last-run-1" from add page with pipeline
              And user is at pipelines page
              And pipeline "nodejs-last-run-1" is executed for 5 times
             When user clicks node "nodejs-last-run-1" to open the side bar
             Then side bar is displayed with the pipelines section
              And 3 pipeline runs are displayed under pipelines section of topology page
              And View all link is displayed


        @manual
        Scenario: Start the pipeline with cancelled tasks: P-07-TC17
            Given pipeline "pipeline-three" is present on Pipeline Details page
              And pipeline run is available with cancelled tasks for pipeline "pipeline-three"
             When user selects "Start" option from kebab menu for pipeline "pipeline-three"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see the pipelineRuns with status as "Running"


        @manual
        Scenario: Start the pipeline with failed tasks: P-07-TC18
            Given pipeline "pipeline-four" is present on Pipeline Details page
              And pipeline run is available with failed tasks for pipeline "pipeline-four"
             When user selects "Start" option from kebab menu for pipeline "pipeline-four"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see the pipelineRuns with status as "Running"


        @manual
        Scenario: Start the pipeline with successful tasks: P-07-TC19
            Given pipeline "pipeline-five" is present on Pipeline Details page
              And pipeline run is available with successful tasks for pipeline "pipeline-five"
             When user selects "Start" option from kebab menu for pipeline "pipeline-five"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see the pipelineRuns with status as "Running"


        @regression @manual
        Scenario: Editing a pipeline structure should not affect the previously executed pipeline runs: P-07-TC21
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
        Scenario: Display failure details on pipeline run details: P-07-TC22
            Given user is at pipeline page in developer perspective
              And a failed pipeline is present
             When user goes to failed pipeline run of pipeline "devfilev2"
              And user opens pipeline run details
             Then user can see status as Failure
              And user can view failure message under Message heading
              And user can see Log snippet to get know what taskruns failed


        @regression
        Scenario: Display failure details of pipeline run in topology sidebar: P-07-TC23
            Given user is at the Topology page
              And a node with an associated pipeline "devfilev2" is present
             When user opens sidebar of the node "devfilev2"
              And user scrolls down to pipeline runs section
             Then user will see the pipeline run name with failed status
              And user will see failure message below pipeline runs
              And user will also see the log snippet


        @regression
        Scenario: Start pipeline modal with different Workspaces: P-07-TC24
            Given pipeline "pipeline-workspace" is created with "git-PVC" workspace
             When user selects "Start" option from kebab menu for pipeline "pipeline-workspace"
              And user navigates to Workspaces section
              And user clicks on "git-PVC" workspace dropdown with Empty Directory selected by default
             Then user sees option Empty Directory, Config Map, Secret, PersistentVolumeClaim, VolumeClaimTemplate


        @regression @manual
        Scenario: Show VolumeClaimTemplate options: P-07-TC25
            Given pipeline "pipevc-no-workspace" with at least one workspace "vct" and no previous Pipeline Runs
             When user selects "Start" option from kebab menu for pipeline "pipevc-no-workspace"
              And user navigates to Workspaces section
              And user clicks Show VolumeClaimTemplate options
             Then user can see Storage Class
              And user can see Access Mode
              And user can see Size
              And user can see Volume Mode


        @regression
        Scenario: Create VolumeClaimTemplate workspace in Start pipeline modal: P-07-TC26
            Given pipeline "new-pipeline-vc" with at least one workspace "vct" and no previous Pipeline Runs
             When user selects "Start" option from kebab menu for pipeline "new-pipeline-vc"
              And user navigates to Workspaces section
              And user selects "VolumeClaimTemplate" option from workspace dropdown
              And user clicks Show VolumeClaimTemplate options
              And user clicks on Start
             Then user will be redirected to Pipeline Run Details page
              And user will see VolumeClaimTemplate Workspace in Pipeline Run Details page


        @regression @manual
        Scenario: Pipeline Run details page with passed pipeline run having finally task: P-07-TC27
            Given user has pipeline "pipeline-one" with finally task having passed pipeline run
              And user is on Pipeline Run details page of passed pipeline run
             When user hovers over each of the finally task arranged in parallel
             Then user can see tooltip with task name and Finally task mentioned while hovering on it


        @regression @manual
        Scenario: Pipeline Run details page with failed pipeline run having finally task: P-07-TC28
            Given user has pipeline "pipeline-finally-failed" with three tasks in series and a finally task
              And user has failed pipeline run for pipeline "pipeline-finally-failed" with third task as failure
              And user is on Pipeline Run details page of failed pipeline run
             When user hovers over each of the finally task arranged in parallel with each task as passed
              And user can see tooltip with task name and Finally task mentioned while hovering on it
              And user can see failed task before finally task


        @regression
        Scenario: Pipeline Run results on Pipeline Run details page for passed pipeline run: P-07-TC29
            #Run oc apply -f ../../testData/pipelines-workspaces/sum-three-pipeline.yaml
            Given user has passed pipeline run
              And user is on Pipeline Run details page of "sum-three-pipeline-run" pipeline run
             When user scrolls to the Pipeline Run results section
             Then user can see Name and Value column under Pipeline Run results


        @regression @manual
        Scenario: Pipeline Run results on Pipeline Run details page for failed pipeline run: P-07-TC30
            #Run oc apply -f ../../testData/pipelines-workspaces/sum-three-pipeline.yaml
            Given user has failed pipeline run for pipeline "sum-three-pipeline-run"
              And user is on Pipeline Run details page
             Then user can not see Pipeline Run results section


        @regression @manual
        Scenario: Pipeline Run details page with passed pipeline run having Conditional task: P-07-TC31
            Given user has passed pipeline run having a succeeded Conditional task for pipeline "new-pipeline1"
              And user is on Pipeline Run details page
             When user hovers over the diamond before the Conditional task
             Then user can see tooltip with "When expression was met" mentioned on it
              And user can see green color associated with the diamond to represent succeeded condition


        @regression @manual
        Scenario: Pipeline Run details page with passed pipeline run having skipped Conditional task: P-07-TC32
            Given user has passed pipeline run having a two Conditional task with one of them being skipped for pipeline "new-pipeline2"
              And user is on Pipeline Run details page
             When user hovers over the diamond before the skipped Conditional task
             Then user can see tooltip with "When expression was not met" mentioned on it
              And user can see grey color associated with the diamond to represent condition not met


        @regression @manual @odc-6303
        Scenario: Show failed PipelineRun log snippet on the log page: P-07-TC33
        # petclinic-pipeline-all.yaml can be found here in /testData/petclinic-pipeline-all.yaml
            Given pipeline is 'petclinic-pipeline-all.yaml' present on Pipeline Details page
             When user selects "Start" option from kebab menu
              And user selects 'maven-cache-pvc' PVC for maven-cache workspace
              And user selects 'maven-settings' ConfigMap for maven-settings workspace
              And user selects 'app-source-pvc' PVC for app-source workspace
              And user clicks on Start button
              And user navigates to pipelineRun logs tab
             Then user is able to see log snippet for failure of "build-image" task

        @regression @odc-4793
        Scenario: Pipeline Run details page with Parameters tab and no parameters: P-07-TC34
            Given pipeline run is displayed for "pipeline-run-no-parameters" without resource
              And user is at pipelines page
             When user clicks Last Run value of "pipeline-run-no-parameters"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see Details, YAML, TaskRuns, Parameters, Logs and Events tabs
              And user navigates to pipelineRun parameters tab
              And user is able to see No parameters are associated with this PipelineRun

        @regression @odc-4793
        Scenario: Pipeline Run with parameters: P-07-TC35
            Given pipeline run is displayed for "pipeline-run-parameters" with parameters
              And user is at pipelines page
             When user clicks Last Run value of "pipeline-run-parameters"
             Then user will be redirected to Pipeline Run Details page
              And user navigates to pipelineRun parameters tab
              And user is able to see parameters of pipelineRun
              And user is able to see name "testName" and value "testValue" parameters value of pipelineRun


        @regression @odc-4793
        Scenario: Status for the cancelled pipeline: P-07-TC34
            Given user creates pipeline using git named "pipeline-cancel"
              And user is at the Pipeline Details page of pipeline "pipeline-cancel"
             When user starts the pipeline "pipeline-cancel" in Pipeline Details page
              And user selects option "Cancel" from Actions menu drop down
             Then status displays as "Cancelled" in pipeline run details page


        @regression @odc-4793
        Scenario: Status for the stopped pipeline: P-07-TC35
            Given user creates pipeline using git named "pipeline-stop"
              And user is at the Pipeline Details page of pipeline "pipeline-stop"
             When user starts the pipeline "pipeline-stop" in Pipeline Details page
              And user selects option "Stop" from Actions menu drop down
             Then status displays as "Cancelled" in pipeline run details page
