@pipelines
Feature: Pipeline metrics
              As a user, I want to see an overall how well my Pipeline Runs have gone and how long they take to run.


        Background:
            Given user has created or selected namespace "aut-pipe-metrics"
              And user is at pipelines page


        @regression, @to-do
        Scenario: Pipeline metrics tab
            Given pipeline is present
             When user clicks on available pipeline
             Then user is able to see Dashboard tab in pipeline details page


        @regression, @to-do
        Scenario: Graphs in dashboard tab
            Given user is in pipeline details tab
              And pipeline run is present
             When user clicks on dashboard tab
             Then user can see Time Range and Refresh Interval dropdowns with a default value of 1 day and 30 seconds respectively
              And user can see Pipeline success ratio, Number of Pipeline Runs, Pipeline Run duration, Task Run duration graphs
              And user can see tooltips for each datapoint that include both x and y values when hover over it


        @regression, @to-do
        Scenario: Empty dashboard tab
            Given user is in pipeline details tab
              And no pipeline runs are present
             When user clicks on dashboard tab
             Then user can see empty page with message "Start your pipeline to view pipeline metrics"


        @regression, @to-do
        Scenario: No datapoint graphs in dashboard tab
            Given user is in pipeline details tab
              And pipeline run has just started
             When user clicks on dashboard tab
             Then user can see Time Range and Refresh Interval dropdowns with a default value of 1 day and 30 seconds respectively
              And user can see Pipeline success ratio, Number of Pipeline Runs, Pipeline Run duration, Task Run duration graphs
              And user can see message "No datapoints found" inside graphs
