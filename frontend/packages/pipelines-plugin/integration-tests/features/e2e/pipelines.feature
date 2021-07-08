@pipelines
Feature: Create Pipeline from Add Options
              As a user, I want to create, edit, delete and view the pipeline

        Background:
            Given user has created or selected namespace "pipelines-ci"


        @smoke
        Scenario Outline: Create a pipeline from git workload with resource type "<resource>": P-01-TC02
            Given user is at Import from Git form
             When user enters Git Repo url as "<git_url>"
              And user enters Name as "<pipeline_name>" in General section
              And user selects resource type as "<resource>"
              And user selects Add Pipeline checkbox in Pipelines section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<pipeline_name>" in topology page

        Examples:
                  | git_url                                 | pipeline_name | resource   |
                  | https://github.com/sclorg/nodejs-ex.git | git-pipeline  | Deployment |


        Scenario Outline: Pipelines page display on newly created pipeline: P-06-TC02
            Given user is at pipelines page
             When user searches pipeline "<pipeline_name>" in pipelines page
             Then pipelines table displayed with column names Name, Last Run, Task Status, Last Run Status and Last Run Time
              And column Name display with value "<pipeline_name>"
              And columns Last Run, Task Run Status, Last Run Status, Last Run Time with values display "-"
              And Create Pipeline button is enabled
              And kebab menu button is displayed
              And kebab menu contains options Start, Add Trigger, Edit Pipeline, Delete Pipeline

        Examples:
                  | pipeline_name |
                  | git-pipeline  |


        Scenario Outline: Pipelines Details page: P-06-TC01
            Given user is at pipelines page
             When user clicks pipeline name "<pipeline_name>" on Pipelines page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"
              And user is able to see Details, Metrics, YAML, Pipeline Runs, Parameters and Resources tabs
              And Details tab is displayed with field names Name, Labels, Annotations, Created At, Owner and Tasks
              And Actions dropdown display in the top right corner of the page

        Examples:
                  | pipeline_name |
                  | git-pipeline  |



