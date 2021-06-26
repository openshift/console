@pipelines
Feature: Display task runs page
              As a developer, I would like to navigate from a PipelineRun to the related TaskRuns and their associated pods so that I can debug my pipelines by looking at the volumes, secrets, etc that are made available to the taskruns and pods.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-pipelines-task-runs"
              And user is at pipelines page


        @smoke
        Scenario: Task runs tab
            Given pipeline run is displayed for "pipeline-tasks-one" with resource
             When user clicks on pipeline "pipeline-tasks-one"
              And user clicks on Pipeline Runs tab
              And user clicks on a Pipeline Run
              And user clicks on Task Runs tab
             Then user can see different task runs based on number of tasks executed in pipeline
              And user can see Name, Task, Pod, Status and Started columns


        @regression
        Scenario: Options in kebab menu of task runs
            Given user is at pipeline details page with pipeline runs
             When user clicks on Task Runs tab
              And user clicks kebab menu of a task run
             Then user can see kebab menu options Edit labels, Edit annotations, Edit Task Run and Delete Task Run


        @regression
        Scenario: Task Runs Details page for passed task runs
            Given user is at pipeline details page with pipeline runs
             When user clicks on pipeline runs tab
              And user clicks on a pipeline run
              And user clicks on Task Runs tab
              And user clicks on a Succeeded task run
             Then user is redirected to Task Run Details tab
              And user can see "Details", "Log", "YAML" and "Events" tab
              And user can see Status and Pods in "Details" tab


        @regression
        Scenario: Task Runs Details page for failed task runs
            Given user is at pipeline details page with pipeline runs
             When user clicks on pipeline runs tab
              And user clicks on a pipeline run
              And user clicks on Task Runs tab
              And user clicks on a Failed task run
             Then user is redirected to Task Run Details tab
              And user can see "Details", "Log", "YAML" and "Events" tab
              And user can see Status, Message and Log snippet in "Details" tab
