@pipelines
Feature: Events tab in Pipeline run and Task run details pages
              As a user, I want to see Events tab in Pipeline run and Task run details pages

        Background:
            Given user has created or selected namespace "aut-pipelines"


        @regression
        Scenario: Events tab in pipeline run details page of administrator perspective: P-03-TC01
            Given user is at administrator perspective
              And pipeline named "pipe-one" is available with pipeline run
             When user clicks on pipeline tab in navigation menu
              And user clicks on Pipelines Tab
              And user goes to Pipeline Runs tab
              And user clicks on pipeline run for pipeline "pipe-one"
              And user clicks on Events tab
             Then user can see events streaming for pipeline runs and all the associated task runs and pods



        @regression
        Scenario: Events tab in task run details page of administrator perspective: P-03-TC02
            Given user is at administrator perspective
              And task named "ex-task-one" is available with task run
             When user clicks on pipeline tab in navigation menu
              And user clicks on Tasks
              And user goes to Task Runs tab
              And user opens task run for pipeline "new-pipeline-one"
              And user clicks on Events tab
             Then user can see events streaming for task runs and all associated pods


        @smoke
        Scenario: Events tab in pipeline run details page of developer perspective: P-03-TC03
            Given user is at developer perspective
              And user is at pipelines page
              And pipeline run is displayed for "ex-pipeline-two" with resource
              And user is at pipelines page
             When user clicks on pipeline "ex-pipeline-two"
              And user navigates to Pipeline Runs tab
              And user clicks on pipeline run for pipeline "ex-pipeline-two"
              And user clicks on Events tab in pipeline Runs page
             Then user can see events streaming for pipeline runs and all the associated task runs and pods


        @regression
        Scenario: Events tab in task run details page of developer perspective: P-03-TC04
            Given user is at developer perspective
              And task named "ex-task-one" is available with task run for pipeline
             When user clicks on pipeline tab in navigation menu
              And user clicks on available pipeline "new-pipeline-one"
              And user goes to Pipeline Runs tab
              And user opens pipeline run "new-pipeline-one"
              And user goes to Task Runs tab
              And user opens task run "new-pipeline-one"
              And user clicks on Events tab
             Then user can see events streaming for task runs and all associated pods
