@pipelines
Feature: Display task runs page
              As a developer, I would like to navigate from a PipelineRun to the related TaskRuns and their associated pods so that I can debug my pipelines by looking at the volumes, secrets, etc that are made available to the taskruns and pods.

        Background:
            Given user has created or selected namespace "aut-pipe-task-runs"


        @regression, @to-do
        Scenario: Task runs tab
            Given user is at pipeline details page with pipeline runs
             When user clicks on pipeline runs tab
              And user clicks on a pipeline run to see Task Runs tab
              And user clicks on Task Runs tab
             Then user can see different task runs based on number of tasks executed in pipeline
              And user can see "Name", "Task", "Pod", "Status" and "Started" columns


        @regression, @to-do
        Scenario: Options in kebab menu of task runs
            Given user is at pipeline details page with pipeline runs
             When user clicks on Task Runs tab
              And user clicks kebab menu of a task run
             Then user can see kebab menu options Edit labels, Edit annotations, Edit Task Run and Delete Task Run


        @regression, @to-do
        Scenario: Task Runs Details page for passed task runs
            Given user is at pipeline details page with pipeline runs
             When user clicks on pipeline runs tab
              And user clicks on a pipeline run
              And user clicks on Task Runs tab
              And user clicks on a Succeeded task run
             Then user is redirected to Task Run Details tab
              And user can see "Details", "Log", "YAML" and "Events" tab
              And user can see Status and Pods in "Details" tab


        @regression, @to-do
        Scenario: Task Runs Details page for failed task runs
            Given user is at pipeline details page with pipeline runs
             When user clicks on pipeline runs tab
              And user clicks on a pipeline run
              And user clicks on Task Runs tab
              And user clicks on a Failed task run
             Then user is redirected to Task Run Details tab
              And user can see "Details", "Log", "YAML" and "Events" tab
              And user can see Status, Message and Log snippet in "Details" tab


        @regression, @manual
        Scenario Outline: Task Runs Details page with Workspaces
            Given user is at Task Runs tab of pipeline run with all kind of Workspaces
             When user clicks on a task run associated with "<workspace_name>" "<resource>" Resources
             Then user is redirected to Task Run Details tab
              And user will see "<workspace_type>" label with "<workspace_name>" Workspace "shared-task-storage" mentioned in the "<resource>" Resources section of Task Run Details page

        Examples:
                  | workspace_type | workspace_name | resource            |
                  | PVC            | PVC            | Workspace           |
                  | CM             | Config Map     | Workspace           |
                  | S              | Secret         | Workspace           |
                  |                | Empty Directory| Workspace           |
                  | PVC            | PVC            | VolumeClaimTemplate |
