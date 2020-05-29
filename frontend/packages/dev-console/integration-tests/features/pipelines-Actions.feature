Feature: Perform the actions on Pipelines page
    As a user I want to view pipeline details, create, edit and delete the pipeline from Pipelines page

Background:
    Given user logged into the openshift application
    And openshift cluster is installed with pipeline operator
    And user is at the project namespace "AUT_MB_Demo" in dev perspecitve


@regression, @smoke
Scenario Outline: Newly created pipeline details in Pipelines page : P-03-TC01  
   Given user is at pipelines page
   When the user enters "<pipeline_name>" into the pipelines search bar
   Then pipelines table displayed with column names "Name", "Namespace", "Last Run", "Task Status", "Last Run Status" and "Last Run Time"
   And column Name display with value "<pipeline_name>"
   And column Namespace display with value "AUT_MB_Demo"
   And columns Last Run, Task Run Status, Last Run Status, Last Run Time with values display "-"
   And Create Pipeline button is enabled
   And kebab menu is displayed

Examples:
| pipeline_name |
| nodejs-ex.git |


@regression
Scenario Outline: Kebab menu options of newly created pipeline in Pipelines page : P-04-TC09
   Given user is at pipelines page
   When the user enters "<pipeline_name>" into the pipelines search bar
   And click kebab menu for the respective pipeline
   Then kebab menu display with  options "Start", "Add Trigger", "Remove Trigger", "Edit Pipeline", "Delete Pipeline"

Examples:
| pipeline_name |
| nodejs-ex.git |


@regression, @smoke
Scenario Outline: Pipelines Details page : P-03-TC01
   Given user is at pipelines page
   When user clicks pipeline name "<pipeline_name>" on Pipelines page
   Then user redirects to Pipeline Details page with header name "<pipeline_name>"
   And user is able to see Details, YAML, Pipeline Runs, Parameters and Resources tabs
   And Details tab is displayed with field names "Name", "Namespace", "Labels", "Annotations", "Created At", "Owner" and "Tasks"
   And Actions dropdown display in the top right corner of the page

Examples:
| pipeline_name |
| pipelines-one |


@regression
Scenario: Actions menu of newly created pipeline in Pipeline Details page : P-03-TC10
   Given user is at pipeline details page with newly created pipeline
   When user clicks Actions menu present in the top right corner of the page
   Then Actions menu display with options "Start", "Add Trigger", "Edit Pipeline", "Delete Pipeline"


Scenario Outline: Verify the details of completed pipeline run
    Given user is at the "Pipeline Run Details" page
    Then the pipelien run status displays as "<pipeline_status>" in Pipeline run page
    And the Last run status of the "<pipeline_name>" displays as "<pipeline_status>" in pipelines page

Examples:
| pipeline_name | pipeline_status |
| nodejs-ex-git | Succeeded       |


@regression, @smoke
Scenario Outline: Edit the Pipeline from pipelines Details page : P-08-TC01
   Given user is at the pipelines page
   And pipeline with name "<pipeline_name>" is present on Pipelines page
   When user searches with pipeline name "<pipeline_name>" on Pipelines page
   And click pipeline name "<pipeline_name>" from searched results on Pipelines page
   And user selects the option "Edit Pipeline" from Actions menu drop down
   Then user is at the Pipeline Builder page
   And "<pipeline_name>" field should be disabled
   And "Add Parameters" link, "Add Resources" link, "Task"  should be enabled

Examples:
| pipeline_name |
| pipelines-one |


@regression
Scenario Outline: Delete the Pipeline from pipelines Details page
   Given user is at the pipelines page
   And pipeline with name "<pipeline_name>" is present on Pipelines page
   When user searches with pipeline name "<pipeline_name>" on Pipelines page
   And click pipeline name "<pipeline_name>" from searched results on Pipelines page
   And user selects the option "Delete Pipeline" from Actions menu drop down
   And click "Delete" button on "Delete Pipeline?" popup
   Then user is at the Pipelines page
   But "<pipeline_name>" should not be displayed on Pipelines page

Examples:
| pipeline_name |
| pipelines-one |


@regression
Scenario Outline: Delete the Pipeline from pipelines page


@regression
Scenario Outline: Edit the Pipeline from pipelines page


@regression, @smoke
Scenario Outline: Start the basic pipeline from pipelines page: P-04-TC01
    Given user is at the Pipelines page
    And pipeline "<pipeline_name>" consists of task "<task_name>" without parameters and resources
    When user selects "start" from the kebab menu
    Then page redirects to Pipeline Run Details page
    
Examples:
| pipeline_name                     | task_name |
| pipe-task-withoutparams-resoruces | kn        |


@regression
Scenario Outline: Kebab menu options of pipeline with atleast one pipeline run in Pipelines page : P-04-TC09
   Given user is at pipelines page
   When the user clicks kebab menu for the pipeline"<pipeline_name>"
   Then kebab menu display with  options "Start", "Start Last Run", "Add Trigger", "Edit Pipeline", "Delete Pipeline"

Examples:
| pipeline_name |
| nodejs-ex.git |


@regression, @smoke
Scenario Outline: Perform Start Last Run for the basic pipeline from pipelines page: P-05-TC03
    Given user is at the Pipelines page
    And pipeline "<pipeline_name>" consists of task "<task_name>" without parameters and resources
    When user selects "Start Last Run" from the kebab menu
    Then page redirects to Pipeline Run Details page
    
Examples:
| pipeline_name                     | task_name |
| pipe-task-withoutparams-resoruces | kn        |