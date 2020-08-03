Feature: Pipeline Runs
    As a user I want to start pipeline, rerun, delete pipeline run

Background:
    Given openshift cluster is installed with pipeline operator
    And user is at the project namespace "aut-pipelines-runs" in dev perspecitve
    And user is at pipelines page


@regression
Scenario Outline: Start pipeline popup details for pipeline with one resource : P-04-TC02    
    Given pipeline "<pipeline_name>" consists of task "<task_name>" with one git resource
    When user selects "Start" option from kebab menu for pipeline "<pipeline_name>"
    Then Start Pipeline popup displays with Git Resources, Advanced Options sections
    And start button is disabled 

Examples:
| pipeline_name           | task_name        |
| pipe-task-with-resoruce | openshift-client |


@regression, @smoke
Scenario Outline: Start the pipeline with one resource : P-04-TC03
    Given pipeline "<pipeline_name>" consists of task "<task_name>" with one git resource
    When user selects "Start" option from kebab menu for pipeline "<pipeline_name>"
    And fills the details in Start Pipeline popup
    Then page redirects to Pipeline Run Details page
    And Pipeline run status displays as "Running"
    And pipeline run details for "<pipeline_name>" display in Pipelines page

Examples:
| pipeline_name             | task_name        |
| pipe-task-with-resoruce-2 | openshift-client |


@regression, @smoke
Scenario Outline: Verify the pipeline status in "Last Run Status" column of Pipelines page after starting pipeline Run : P-05- TC01
    Given pipeline run is displayed for "<pipeline_name>" with resource
    When user navigates to Pipelines page
    Then Last Run status of the "<pipeline_name>" displays as "Running"

Examples:
| pipeline_name             |
| pipe-task-with-resoruce-3 |


@regression, @smoke
Scenario Outline: Pipeline Run Details page for pipeline without resource : P-06-TC03
    Given pipeline run is displayed for "<pipeline_name>" without resource
    When user clicks Last Run value of "<pipeline_name>"
    Then user redirects to Pipeline Run Details page
    And user is able to see Details, YAML and Logs tabs
    And Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner, Status, Pipeline and Triggered by
    And Actions dropdown display on the top right corner of the page

Examples:
| pipeline_name              |
| pipe-task-with-resoruce-03 |


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
| pipeline_name             |
| pipe-task-with-resoruce-5 |


@regression, @smoke
Scenario Outline: Rerun the Pipeline Run from pipeline runs page : P-06-TC02
    Given pipeline run is displayed for "<pipeline_name>" without resource
    When user selects the Pipeline Run for "<pipeline_name>"
    And user selects Rerun option from kebab menu of "<pipeline_name>"
    Then page redirects to pipeline runs page

Examples:
| pipeline_name             |
| pipe-task-with-resoruce-6 |


@regression, @smoke
Scenario Outline: Pipeline Run Details page for a pipeline with resource : P-06-TC04
    Given pipeline run is displayed for "<pipeline_name>" with resource
    When user clicks Last Run value of the pipeline "<pipeline_name>"
    Then user redirects to Pipeline Run Details page
    And Pipeline Resources field will be displayed

Examples:
| pipeline_name             |
| pipe-task-with-resoruce-4 |


@regression, @smoke
Scenario Outline: Filter the pipeline runs based on status : P-06-TC07
    Given pipeline "<pipeline_name>" is executed for 3 times
    And user is at the Pipeline Runs page
    When user filters the pipeline runs based on the "<status>"
    Then user able to see the pipelineruns with "<status>"

Examples:
| pipeline_name              | status    |
| pipe-task-without-resoruce | Succeeded |


@regression, @smoke
Scenario Outline: Start the pipeline from Pipeline Details page : P-04-TC04
    Given pipeline "<pipeline_name>" is available in pipelines page
    When user selects "Start" option from pipeline Details Actions menu
    Then user redirects to Pipeline Run Details page

Examples:
| pipeline_name             |
| pipe-task-with-resoruce-8 |


@regression, @manual
Scenario Outline: Download the logs from Pipeline Details page : P-04-TC05
    Given user is at the Pipeline Details page


@regression
Scenario: kebab menu options in pipelines page : P-04-TC07
    Given user is at Pipelines page


@regression
Scenario: Start LastRun from topolgy page : P-05- TC04
    Given user is at the topolgy page
    And one pipeline run is completed with the workload


@regression
Scenario: Start LastRun from topolgy page : P-05- TC04
    Given user is at the topolgy page
    And one pipeline run is completed with the workload


@regression
Scenario: Maximum pipeline runs display in topology page: P-05-TC05
    Given 5 pipeline runs are completed with the git workload
    And user is at the topolgy page
    When user clicks on the node name
    Then side pane is displayed with the pipelines section
    And 3 pipeline runs are displayed under pipelines section of topolgy page
 

@regression, @manual
Scenario: Download the logs from Pipeline Details page after pipleine run: P-05-TC06
    Given user is at the Pipeline Details page


Scenario: Start the pipeline wtih cancelled tasks: P-07- TC04
    Given user is at the Pipeline Details page
    And pi[peline run is available with cancelled tasks


Scenario: Start the pipeline wtih failed tasks: P-07- TC05
    Given user is at the Pipeline Details page
    And pi[peline run is available with failed tasks


Scenario: Start the pipeline wtih successful tasks: P-07- TC06
    Given user is at the Pipeline Details page
    And pi[peline run is available with failed tasks


@regression, @smoke
Scenario Outline: Verify the pipeline status in side pane of topology page : P-05- TC02
    Given pipeline "<pipeline_name>" is created from git page
    And pipeline run is displayed for "<pipeline_name>" in pipelines page
    When user navigates to Topology page
    Then Last Run status of the "<pipeline_name>" displays as "Succeeded" in topology page

Examples:
| pipeline_name             |
| pipe-task-with-resoruce-9 |
