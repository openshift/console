Feature: Pipeline Runs
    As a user I want to start pipeline, rerun, delete pipeline run

Background:
    Given user logged into the openshift application
    And openshift cluster is installed with pipeline operator
    And user is at the project namespace "AUT_MB_Demo" in dev perspecitve


@regression
Scenario Outline: Start pipeline popup details for pipeline with one resource : P-04-TC02
    Given user is at the Pipelines page
    And pipeline "<pipeline_name>" consists of task "<task_name>" with one git resource
    When user selects "start" from the kebab menu
    Then "Start Pipeline" popup displays with Git Resources, Advanced Options sections
    And start button is disabled 

Examples:
| pipeline_name           | task_name        |
| pipe-task-with-resoruce | openshift-client |


@regression, @smoke
Scenario Outline: Start the pipeline with one resource : P-04-TC03, P-05- TC01, P-05- TC02
    Given user is at the Pipelines page
    And pipeline "<pipeline_name>" consists of task "<task_name>" with one git resource
    When user selects "start" from the kebab menu
    And fills the necessary details in "Start Pipeline" popup
    Then page redirects to "Pipeline Run Details" page
    And Pipeline run status displays as "Running"
    And pipeline run details display in Pipelines page
    And pipeline run details display in Topology page

Examples:
| pipeline_name           | task_name        |
| pipe-task-with-resoruce | openshift-client |


@regression, @smoke
Scenario: Pipeline Run Details page for pipeline without resource : P-06-TC03
    Given user is at the Pipelines page
    And pipeline run is displayed
    When user clicks Last Run value of pipeline
    Then user redirects to Pipeline Run Details page
    And user is able to see Details, YAML and Logs tabs
    And Details tab is displayed with field names "Name", "Namespace", "Labels", "Annotations", "Created At", "Owner", "Pipeline" and "Triggered by"
    And Actions dropdown display on the top right corner of the page


@regression
Scenario Outline: Actions on Pipeline Run Details page : P-06-TC06
    Given user is at the Pipeline Run Details page
    When user clicks Actions menu on the top right corner of the page
    Then Actions menu display with the options "Rerun", "Delete Pipeline Run"


@regression
Scenario Outline: Rerun the Pipeline Run from pipeline run details page: P-06-TC01
    Given user is at the Pipeline Run Details page
    When user selects "Rerun" from the Actions menu 
    Then pipeline run details page heading name will change


@regression, @smoke
Scenario Outline: Rerun the Pipeline Run from pipeline runs page : P-06-TC02
    Given user is at the Pipeline Runs page
    When user selects "Rerun" from the kebab menu 
    Then page redirects to pipeline run details page


@regression, @smoke
Scenario Outline: Pipeline Run Details page for a pipeline with resource : P-06-TC04
    Given user is at the Pipelines page
    And pipeline run is displayed
    When user clicks Last Run value of the pipeline "<pipeline_name>"
    Then user redirects to Pipeline Run Details page
    And Pipeline Resources field will be displayed

Examples:
| pipeline_name           |
| pipe-task-with-resoruce |


@regression, @smoke
Scenario Outline: Filter the pipeline runs based on status : P-06-TC07
    Given user is at the Pipeline Runs page


@regression, @smoke
Scenario Outline: Start the pipeline from Pipeline Details page : P-04-TC04
    Given user is at the Pipeline Runs page


@regression, @manual
Scenario Outline: Download the logs from Pipeline Details page : P-04-TC05
    Given user is at the Pipeline Details page


@regression
Scenario Outline: kebab menu options in pipelines page : P-04-TC07
    Given user is at the Pipelines page


@regression
Scenario Outline: Start LastRun from topolgy page : P-05- TC04
    Given user is at the topolgy page
    And one pipeline run is completed with the workload


@regression
Scenario Outline: Start LastRun from topolgy page : P-05- TC04
    Given user is at the topolgy page
    And one pipeline run is completed with the workload


@regression, @smoke
Scenario Outline: Maximum pipeline runs display in topology page: P-05-TC05
    Given user is at the topolgy page
    And 5 pipeline runs are completed with the workload


@regression, @manual
Scenario Outline: Download the logs from Pipeline Details page after pipleine run: P-05-TC06
    Given user is at the Pipeline Details page


Scenario Outline: Start the pipeline wtih cancelled tasks: P-07- TC04
    Given user is at the Pipeline Details page
    And pi[peline run is available with cancelled tasks


Scenario Outline: Start the pipeline wtih failed tasks: P-07- TC05
    Given user is at the Pipeline Details page
    And pi[peline run is available with failed tasks


Scenario Outline: Start the pipeline wtih successful tasks: P-07- TC06
    Given user is at the Pipeline Details page
    And pi[peline run is available with failed tasks
