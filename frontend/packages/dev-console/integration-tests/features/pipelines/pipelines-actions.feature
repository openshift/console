Feature: Perform the actions on Pipelines page
   As a user, I want to view pipeline details, create, edit and delete the pipeline from Pipelines page

Background:
   Given user has installed OpenShift Pipelines operator
   And user has selected namespace "aut-pipeline-actions"
   And user is at pipelines page


@regression, @smoke
Scenario Outline: Pipelines Details page : P-03-TC01
   Given pipeline "<pipeline_name>" is present on Pipelines page
   When user clicks pipeline name "<pipeline_name>" on Pipelines page
   Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"
   And user is able to see Details, YAML, Pipeline Runs, Parameters and Resources tabs
   And Details tab is displayed with field names Name, Labels, Annotations, Created At, Owner and Tasks
   And Actions dropdown display in the top right corner of the page

Examples:
| pipeline_name |
| pipelines-bbb |


@regression, @smoke
Scenario Outline: Pipelines page display on newly created pipeline : P-03-TC12 
   Given pipeline "<pipeline_name>" is present on Pipelines page
   When user searches pipeline "<pipeline_name>" in pipelines page
   Then pipelines table displayed with column names Name, Last Run, Task Status, Last Run Status and Last Run Time
   And column Name display with value "<pipeline_name>"
   And columns Last Run, Task Run Status, Last Run Status, Last Run Time with values display "-"
   And Create Pipeline button is enabled
   And kebab menu button is displayed

Examples:
| pipeline_name |
| pipelines-aaa |


@regression
Scenario: Kebab menu options of newly created pipeline in Pipelines page : P-03-TC09
   Given pipeline "pipelines-aaa" is present on Pipelines page
   When user searches pipeline "<pipeline_name>" in pipelines page
   And user clicks kebab menu for the pipeline "pipelines-aaa"
   Then kebab menu displays with options Start, Add Trigger, Remove Trigger, Edit Pipeline, Delete Pipeline


@regression
Scenario: Kebab menu options of pipeline with atleast one pipeline run in Pipelines page : P-03-TC09
   Given pipeline run is displayed for "<pipeline_name>" with resource
   When user clicks kebab menu for the pipeline "nodejs-ex.git"
   Then user will see "Start Last Run" under Kebab menu


@regression
Scenario: Actions menu of newly created pipeline in Pipeline Details page : P-03-TC10
   Given user is at pipeline details page with newly created pipeline "nodejs-ex-git"
   When user clicks Actions menu in pipeline Details page
   Then Actions menu display with options "Start", "Add Trigger", "Edit Pipeline", "Delete Pipeline"


Scenario Outline: Details of completed pipeline run
   Given pipeline run is available for "<pipeline_name>"
   When user clicks pipeline run of pipeline "<pipeline_name>"
   Then Pipeline run details page is dislayed
   And pipeline run status displays as "<pipeline_status>" in Pipeline run page
   And Last run status of the "<pipeline_name>" displays as "<pipeline_status>" in pipelines page

Examples:
| pipeline_name | pipeline_status |
| nodejs-ex-git | Succeeded       |


@regression, @smoke
Scenario Outline: Edit the Pipeline from pipelines Details page : P-08-TC01
   Given pipeline "<pipeline_name>" is present on Pipelines page
   When user searches pipeline "<pipeline_name>" in pipelines page
   And user clicks pipeline "<pipeline_name>" from searched results on Pipelines page
   And user selects option "Edit Pipeline" from Actions menu drop down
   Then user is at the Pipeline Builder page
   And Name field will be disabled
   And Add Parameters, Add Resources, Task should be displayed

Examples:
| pipeline_name |
| pipelines-ccc |


Scenario Outline: Add the task by editing the pipeline : P-08-TC02
   Given pipeline with task "<pipeline_name>" is present on Pipelines page
   When user selects "Edit Pipeline" option from kebab menu of "<pipeline_name>"
   And user adds another task "kn" in parallel
   And user clicks on save
   Then user will be redirected to Pipelines page

Examples:
| pipeline_name |
| pipelines-ccc |


@regression, @smoke
Scenario Outline: Delete the Pipeline from pipelines Details page: P-03-TC13
   Given pipeline "<pipeline_name>" is present on Pipelines page
   When user searches pipeline "<pipeline_name>" in pipelines page
   And user clicks pipeline "<pipeline_name>" from searched results on Pipelines page
   And user selects option "Delete Pipeline" from Actions menu drop down
   And user clicks Delete button on Delete Pipeline modal
   Then user will be redirected to Pipelines page
   But "<pipeline_name>" is not displayed on Pipelines page

Examples:
| pipeline_name |
| pipelines-ddd |


@regression
Scenario: Delete the Pipeline from pipelines page
   Given user is at pipelines page
   And pipeline "pipeline-one" is available in pipelines page
   When user selects "Delete Pipeline" from the kebab menu for "<pipeline_name>"
   And user clicks Delete button on Delete Pipeline modal
   Then user will be redirected to Pipelines page


@regression
Scenario: Edit the Pipeline from pipelines page
   Given user is at pipelines page
   And pipeline "pipeline-one" is available in pipelines page
   When user selects "Edit Pipeline" from the kebab menu for "<pipeline_name>" 
   Then user is at the Pipeline Builder page
   And Name field will be disabled
   And Add Parameters, Add Resources, Task should be displayed


@regression, @smoke
Scenario Outline: Start the basic pipeline from pipelines page: P-04-TC01
    Given user is at pipelines page
    And pipeline "<pipeline_name>" consists of task "<task_name>" without parameters and resources
    When user selects "Start" from the kebab menu for "<pipeline_name>" 
    Then user will be redirected to Pipeline Run Details page
    
Examples:
| pipeline_name  | task_name |
| pipe-with-task | kn        |


@regression
Scenario: Start Last Run for the basic pipeline from pipelines page: P-05-TC03
    Given user is at pipelines page
    And pipeline "pipe-task-withoutparams-resoruces" consists of task "kn" without parameters and resources
    When user selects "Start Last Run" from the kebab menu for "pipeline-one"
    Then user will be redirected to Pipeline Run Details page
