Feature: Pipeline Runs
    As a user, I want to start pipeline, rerun, delete pipeline run

Background:
    Given user has installed OpenShift Pipelines operator
    And user has selected namespace "aut-pipelines-runs"
    And user is at pipelines page


@regression
Scenario Outline: Start pipeline popup details for pipeline with one resource : P-04-TC02    
    Given pipeline "<pipeline_name>" consists of task "<task_name>" with one git resource
    When user selects "Start" option from kebab menu for pipeline "<pipeline_name>"
    Then Start Pipeline modal displays with Git Resources, Advanced Options sections
    And start button is disabled 

Examples:
| pipeline_name          | task_name        |
| pipeline-with-resoruce | openshift-client |


@regression, @smoke
Scenario Outline: Start the pipeline with one resource : P-04-TC03
    Given pipeline "<pipeline_name>" consists of task "<task_name>" with one git resource
    When user selects "Start" option from kebab menu for pipeline "<pipeline_name>"
    And user fills the details in Start Pipeline popup
    Then user will be redirected to Pipeline Run Details page
    And Pipeline run status displays as "Running"
    And pipeline run details for "<pipeline_name>" display in Pipelines page

Examples:
| pipeline_name | task_name        |
| pipe-task     | openshift-client |


@regression, @smoke
Scenario Outline: Last Run Status of pipeline in pipelines page after starting pipeline Run : P-05-TC01
    Given pipeline run is displayed for "<pipeline_name>" with resource
    When user navigates to Pipelines page
    Then Last Run status of the "<pipeline_name>" displays as "Running"

Examples:
| pipeline_name |
| pipe-task     |


@regression, @smoke
Scenario Outline: Pipeline Run Details page for pipeline without resource : P-06-TC03
    Given pipeline run is displayed for "<pipeline_name>" without resource
    When user clicks Last Run value of "<pipeline_name>"
    Then user will be redirected to Pipeline Run Details page
    And user is able to see Details, YAML and Logs tabs
    And Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner, Status, Pipeline and Triggered by
    And Actions dropdown display on the top right corner of the page

Examples:
| pipeline_name          |
| pipeline-with-resoruce |


@regression
Scenario: Actions on Pipeline Run Details page : P-06-TC06
    Given user is at the Pipeline Run Details page
    When user clicks Actions menu on the top right corner of the page
    Then Actions menu display with the options "Rerun", "Delete Pipeline Run"


@regression
Scenario Outline: Rerun the Pipeline Run from pipeline run details page: P-06-TC01
    Given user is at the Pipeline Run Details page
    When user selects Rerun option from the Actions menu 
    Then status displays as "Running" in pipeline run details page

Examples:
| pipeline_name          |
| pipeline-with-resoruce |


@regression, @smoke
Scenario Outline: Rerun the Pipeline Run from pipeline runs page : P-06-TC02
    Given pipeline run is displayed for "<pipeline_name>" without resource
    When user selects the Pipeline Run for "<pipeline_name>"
    And user selects Rerun option from kebab menu of "<pipeline_name>"
    Then page will be redirected to pipeline runs page

Examples:
| pipeline_name          |
| pipeline-with-resoruce |


@regression, @smoke
Scenario Outline: Pipeline Run Details page for a pipeline with resource : P-06-TC04
    Given pipeline run is displayed for "<pipeline_name>" with resource
    When user clicks Last Run value of the pipeline "<pipeline_name>"
    Then user will be redirected to Pipeline Run Details page
    And Pipeline Resources field will be displayed

Examples:
| pipeline_name          |
| pipeline-with-resoruce |


@regression, @smoke
Scenario Outline: Filter the pipeline runs based on status : P-06-TC07
    Given pipeline "<pipeline_name>" is executed for 3 times
    When user filters the pipeline runs of pipeline "<pipeline_name>" based on the "<status>"
    Then user is able to see the pipelineruns with "<status>"

Examples:
| pipeline_name             | status    |
| pipeline-without-resoruce | Succeeded |


@regression, @smoke
Scenario: Start the pipeline from Pipeline Details page : P-04-TC04
    Given pipeline "pipeline-one" is available in pipelines page
    When user selects "Start" option from pipeline Details Actions menu
    Then user will be redirected to Pipeline Run Details page


@regression, @manual
Scenario Outline: Download the logs from Pipeline Details page : P-04-TC05
    Given pipeline "pipeline-one" is available in pipelines page
    When user selects "Start" option from kebab menu in pipelines page 
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
    When user clicks pipeline run of pipeline "pipeline-aaa"
    And user navigates to pipelineRuns page
    And user selects the kebab menu in pipeline Runs page
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
    Given 5 pipeline runs are completed with the git workload
    And user is at the Topology page
    When user clicks on the node name
    Then side bar is displayed with the pipelines section
    And 3 pipeline runs are displayed under pipelines section of topology page


Scenario: Start the pipeline with cancelled tasks: P-07-TC04
    Given user is at the Pipeline Details page
    And pipeline run is available with cancelled tasks for pipeline "pipeline-one"
    When user selects "Start" option from kebab menu for pipeline "pipeline-one"
    Then user will be redirected to Pipeline Run Details page
    And Pipeline run status displays as "Running"


Scenario: Start the pipeline with failed tasks: P-07-TC05
    Given user is at the Pipeline Details page
    And pipeline run is available with failed tasks for pipeline "pipeline-one"
    When user selects "Start" option from kebab menu for pipeline "pipeline-one"
    Then user will be redirected to Pipeline Run Details page
    And Pipeline run status displays as "Running"


Scenario: Start the pipeline with successful tasks: P-07-TC06
    Given user is at the Pipeline Details page
    And pipeline run is available with failed tasks for pipeline "pipeline-one"
    When user selects "Start" option from kebab menu for pipeline "pipeline-one"
    Then user will be redirected to Pipeline Run Details page
    And Pipeline run status displays as "Running"


@regression, @smoke
Scenario Outline: Pipeline status display in topology side bar : P-05-TC02
    Given pipeline "<pipeline_name>" is created from git page
    And pipeline run is displayed for "<pipeline_name>" in pipelines page
    When user navigates to Topology page
    Then Last Run status of the "<pipeline_name>" displays as "Succeeded" in topology page

Examples:
| pipeline_name          |
| pipeline-with-resoruce |
