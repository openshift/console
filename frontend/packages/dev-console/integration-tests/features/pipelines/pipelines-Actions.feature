Feature: Perform the actions on Pipelines page
    As a user, I want to view pipeline details, create, edit and delete the pipeline from Pipelines page

Background:
    Given user has installed OpenShift Pipelines operator
    And user has selected namespace "aut-pipeline-actions"


@regression, @smoke
Scenario Outline: Newly created pipeline details in Pipelines page : P-03-TC12 
   Given user is at pipelines page
   And pipeline with name "<pipeline_name>" is present on Pipelines page
   When user enters "<pipeline_name>" into the pipelines search bar
   Then pipelines table displayed with column names Name, Last Run, Task Status, Last Run Status and Last Run Time
   And column Name display with value "<pipeline_name>"
   # And column Namespace display with value "aut-pipeline-actions"
   And columns Last Run, Task Run Status, Last Run Status, Last Run Time with values display "-"
   And Create Pipeline button is enabled
   And kebab menu is displayed

Examples:
| pipeline_name |
| pipelines-aaa |


@regression
Scenario: Kebab menu options of newly created pipeline in Pipelines page : P-04-TC09
   Given user is at pipelines page
   And pipeline with name "pipelines-aaa" is present on Pipelines page
   When user enters "pipelines-aaa" into the pipelines search bar
   And user clicks kebab menu for the pipeline "pipelines-aaa"
   Then kebab menu displays with options Start, Add Trigger, Remove Trigger, Edit Pipeline, Delete Pipeline


@regression, @smoke
Scenario Outline: Pipelines Details page : P-03-TC01
   Given user is at pipelines page
   And pipeline with name "<pipeline_name>" is present on Pipelines page
   When user clicks pipeline name "<pipeline_name>" on Pipelines page
   Then user will get redirected to Pipeline Details page with header name "<pipeline_name>"
   And user is able to see Details, YAML, Pipeline Runs, Parameters and Resources tabs
   And Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created At, Owner and Tasks
   And Actions dropdown display in the top right corner of the page

Examples:
| pipeline_name |
| pipelines-bbb |


@regression
Scenario: Actions menu of newly created pipeline in Pipeline Details page : P-03-TC10
   Given user is at pipeline details page with newly created pipeline
   When user clicks Actions menu in pipeline Details page
   Then Actions menu display with options "Start", "Add Trigger", "Edit Pipeline", "Delete Pipeline"


Scenario Outline: Verify the details of completed pipeline run
    Given user is at pipelines page
    And pipeline run is available for "<pipeline_name>"
    When user clicks pipeline run of pipeline "<pipeline_name>"
    Then Pipeline run details page is dislayed
    And pipelien run status displays as "<pipeline_status>" in Pipeline run page
    And Last run status of the "<pipeline_name>" displays as "<pipeline_status>" in pipelines page

Examples:
| pipeline_name | pipeline_status |
| nodejs-ex-git | Succeeded       |


@regression, @smoke
Scenario Outline: Edit the Pipeline from pipelines Details page : P-08-TC01
   Given user is at pipelines page
   And pipeline with name "<pipeline_name>" is present on Pipelines page
   When user enters "<pipeline_name>" into the pipelines search bar
   And clicks pipeline name "<pipeline_name>" from searched results on Pipelines page
   And user selects the option "Edit Pipeline" from Actions menu drop down
   Then user is at the Pipeline Builder page
   And Name field will be disabled
   And Add Parameters, Add Resources, Task should be displayed

Examples:
| pipeline_name |
| pipelines-ccc |


@regression, @smoke
Scenario Outline: Delete the Pipeline from pipelines Details page: P-03-TC13
   Given user is at pipelines page
   And pipeline with name "<pipeline_name>" is present on Pipelines page
   When user enters "<pipeline_name>" into the pipelines search bar
   And clicks pipeline name "<pipeline_name>" from searched results on Pipelines page
   And user selects the option "Delete Pipeline" from Actions menu drop down
   And clicks Delete on Delete Pipeline popup
   Then user will be redirected to Pipelines page
   But "<pipeline_name>" is not displayed on Pipelines page

Examples:
| pipeline_name |
| pipelines-ddd |


@regression
Scenario Outline: Delete the Pipeline from pipelines page


@regression
Scenario Outline: Edit the Pipeline from pipelines page


@regression, @smoke
Scenario Outline: Start the basic pipeline from pipelines page: P-04-TC01
    Given user is at pipelines page
    And pipeline "<pipeline_name>" consists of task "<task_name>" without parameters and resources
    When user selects "Start" from the kebab menu for "<pipeline_name>" 
    Then page will be redirected to Pipeline Run Details page
    
Examples:
| pipeline_name                     | task_name |
| pipe-task-withoutparams-resoruces | kn        |


@regression
Scenario: Kebab menu options of pipeline with atleast one pipeline run in Pipelines page : P-04-TC09
   Given user is at pipelines page
   When user clicks kebab menu for the pipeline "nodejs-ex.git"
   Then user will see "Start Last Run" under Kebab menu


@regression
Scenario: Start Last Run for the basic pipeline from pipelines page: P-05-TC03
    Given user is at pipelines page
    And pipeline "pipe-task-withoutparams-resoruces" consists of task "kn" without parameters and resources
    When user selects "Start Last Run" from the kebab menu for "pipe-task-withoutparams-resoruces"
    Then page will be redirected to Pipeline Run Details page
