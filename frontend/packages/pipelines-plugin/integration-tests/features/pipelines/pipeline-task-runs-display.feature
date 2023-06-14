@pipelines
Feature: Display task runs page
              As a developer, I would like to navigate from a PipelineRun to the related TaskRuns and their associated pods so that I can debug my pipelines by looking at the volumes, secrets, etc that are made available to the taskruns and pods.

        Background:
            Given user has created or selected namespace "aut-pipelines"
              And user is at pipelines page


        @smoke
        Scenario: Task runs tab: P-05-TC01
            Given pipeline run is displayed for "pipe-one" with resource
             When user clicks on pipeline "pipe-one"
              And user clicks on Pipeline Runs tab
              And user clicks on a Pipeline Run
              And user clicks on Task Runs tab
             Then user can see different task runs based on number of tasks executed in pipeline
              And user can see Name, Task, Pod, Status and Started columns


        @regression
        Scenario: Options in kebab menu of task runs: P-05-TC02
            Given user is at PipelineRuns tab with pipeline runs for pipeline "pipe-one"
             When user clicks on Pipeline Run for "pipe-one"
              And user clicks on TaskRuns tab
              And user clicks kebab menu of a task run
             Then user can see kebab menu option Delete TaskRun


        @regression
        Scenario: Task Runs Details page for passed task runs: P-05-TC03
            Given user is at pipeline details page with pipeline runs "pipe-one"
             When user clicks on pipeline runs tab
              And user clicks on Pipeline Run for "pipe-one"
              And user clicks on Task Runs tab
              And user clicks on task run "pipe-one"
             Then user is redirected to Task Run Details tab
              And user can see Details, Log, YAML and Events tab
              And user can see Status and Pods in Details tab


        @regression
        Scenario: Task Runs Details page for failed task runs: P-05-TC04
            Given user is at pipeline details page with pipeline runs for failed task run in "aut-pipelines" namespace
             When user clicks on pipeline runs tab for pipeline "new-pipeline-failed-task"
              And user clicks on Pipeline Run "pipeline-runs-failed-task"
              And user clicks on Task Runs tab
              And user clicks on task run "pipeline-runs-failed-task"
             Then user is redirected to Task Run Details tab
              And user can see Details, Log, YAML and Events tab
              And user can see Status, Message and Log snippet in Details tab


        @regression @manual
        Scenario Outline: Task Runs Details page with Workspaces: P-05-TC05
            Given pipeline "<pipeline_name>" is created with "<workspace_name>" workspace
              And pipeline "<pipeline_name>" is executed with workspace type "<workspace_type>"
              And user is at Task Runs tab of pipeline run with all kind of Workspaces
             When user clicks on a task run associated with "<workspace_name>" "<resource>" Resources
             Then user is redirected to Task Run Details tab
              And user will see "<workspace_type>" label with "<workspace_name>" Workspace mentioned in the "<resource>" Resources section of Task Run Details page

        Examples:
                  | pipeline_name | workspace_type        | workspace_name      | resource            |
                  | pipe-wp-t1    | PersistentVolumeClaim | PVC                 | Workspace           |
                  | pipe-wp-t2    | Config Map            | Config Map          | Workspace           |
                  | pipe-wp-t3    | Secret                | Secret              | Workspace           |
                  | pipe-wp-t4    | Empty Directory       | Empty Directory     | Workspace           |
                  | pipe-wp-t5    | VolumeClaimTemplate   | VolumeClaimTemplate | VolumeClaimTemplate |


        @regression
        Scenario: Task Run results on Task Run details page for passed task run: P-05-TC06
            Given pipeline run with passed task run is displayed for "aut-pipelines" namespace
             When user clicks on pipeline runs tab for pipeline "pipeline-taskrun-results"
              And user clicks on Pipeline Run "pipeline-runs-taskrun-results"
              And user clicks on Task Runs tab
              And user clicks on task run "pipeline-runs-taskrun-results"
             Then user is redirected to Task Run Details tab
             When user scrolls to the Task Run results section
             Then user can see Name and Value column under Task Run results

        @regression
        Scenario: Check for Duration column when enabled: P-05-TC07
            Given user is at PipelineRuns tab with pipeline runs for pipeline "pipe-one"
             When user clicks on Pipeline Run for "pipe-one"
              And user clicks on TaskRuns tab
              And user clicks manage columns button
              And user enables Duration column
             Then user sees Duration column

        @regression
        Scenario: Check for absence of Duration column when disabled: P-05-TC08
            Given user is at PipelineRuns tab with pipeline runs for pipeline "pipe-one"
             When user clicks on Pipeline Run for "pipe-one"
              And user clicks on TaskRuns tab
              And user verifies that duration column is visible
              And user clicks manage columns button
              And user disables Duration column
             Then user does not see Duration column
