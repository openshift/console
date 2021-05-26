@pipelines
Feature: Pipeline metrics
              As a user, I want to see an overall how well my Pipeline Runs have gone and how long they take to run.


        Background:
            Given user has created or selected namespace "aut-pipelines"
              And user is at pipelines page


        @regression
        Scenario: Pipeline metrics dashboard display for no pipeline runs: P-04-TC01
            Given pipeline "pipeline-metrics" is present on Pipeline Details page
             When user clicks on Metrics tab
             Then user can see empty page with message "Start your pipeline to view pipeline metrics"


        @smoke
        Scenario: Graphs in metrics tab: P-04-TC02
            Given pipeline run is displayed for "pipeline-metrics-one" with resource
             When user clicks on pipeline "pipeline-metrics-one"
              And user clicks on Metrics tab
             Then user can see Time Range with a default value of "1 week"
              And user can see and Refresh Interval with a default value of "30 seconds"
              And user can see Pipeline success ratio, Number of Pipeline Runs, Pipeline Run duration, Task Run duration graphs


        @regression, @to-do
        Scenario: No datapoint graphs in metrics tab: P-04-TC03
            Given pipeline "pipeline-metrics-two" is present on Pipeline Details page
             When user clicks on pipeline "pipeline-metrics-two"
              And user selects option "Start" from Actions menu drop down
              And user navigates to Pipelines page
              And user clicks on pipeline "pipeline-metrics-two"
             Then user can see Time Range with a default value of "1 day"
              And user can see and Refresh Interval with a default value of "30 seconds"
              And user can see Pipeline success ratio, Number of Pipeline Runs, Pipeline Run duration, Task Run duration graphs
              And user can see message "No datapoints found" inside graphs
