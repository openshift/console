Feature: Triggers
    As a user I want to add or remove trigger details and verify the trigger for the git web hooks from pipeline

Background:
    Given user logged into the openshift application
    And openshift cluster is installed with pipeline operator
    And user is at the project namespace "AUT_MB_Demo" in dev perspecitve


@regression, @smoke
Scenario: Add Trigger popup details : P-09-TC01
    Given user is at pipelines page
    And pipeline is available with git resource
    When user selects "Add Trigger" from the kebab menu
    Then popup displays with heading as "Add Tigger" 
    And Git provider type field displayed with "Select Git Provide Type" option
    And Add button will be disabled


@regression, @smoke
Scenario: Variables section in Add Trigger popup details : P-09-TC02
    Given user is at Add Trigger popup
    When user selects an option from Git provider type dropdown
    And  user clicks on "show variables" link 
    Then user should able to see "Hide Variables" link with varaibles section
    And variables section displayed with message "The following variables can be used in the Parameters or when created new Resources."
    And Add button will be enabled


@regression, @smoke
Scenario Outline: Add the trigger to the pipeline from pipelines page : P-09-TC03
    Given user is at pipelines page
    And "<pipeline_name>" is displayed
    When user selects "Add Trigger" from the kebab menu for "<pipeline_name>"
    And selects the "github-pullreq" from Git Provide Type field
    And clicks on "Add" button present in Add Trigger popup
    Then pipelines page is displayed
    And "Remove Trigger" is displayed in kebab menu for "<pipeline_name>"

Examples:
| pipeline_name |
| pipelines-one |


@regression, @smoke
Scenario Outline: Pipeline Trigger template display in pipeline details page: P-09-TC04
    Given pipeline "<pipeline_name>" with trigger in pipelines page
    When user click on "<pipeline_name>"
    Then pipeline Details page is displayed with Trigger Templates section

Examples:
| pipeline_name |
| pipelines-one |


@regression, @smoke
Scenario: Trigger template details page : P-09-TC05
    Given user is at pipeline Details page 
    And Trigger is added to the pipeline present in pipeline details page
    When user click on any trigger template
    Then user redirects to Trigger Template Details page
    And user is able to see Details, YAML tabs
    And Details tab is displayed with field names "Name", "Namespace", "Labels", "Annotations", "Created At", "Owner", "Pipelines" and "Event Listeners"
    And Actions dropdown display on the top right corner of the page


@regression, @smoke
Scenario: Event Listener Details page : P-09-TC06, P-09-TC07
    Given user is at Trigger Template Details page
    When user click on Event listener
    Then user redirects to Event Listener Details page
    And user is able to see Details, YAML tabs
    And Details tab is displayed with field names "Name", "Namespace", "Labels", "Annotations", "Created At", "Owner", "Trigger Templates" and "Trigger Bindings"
    And Actions dropdown display on the top right corner of the page


@regression, @smoke
Scenario: Trigger Binding Details page : P-09-TC08, P-09-TC09
    Given user is at Event Listener Details page
    When user click on Trigger Binding
    Then user redirects to Cluster Trigger Binding Details page
    And user is able to see Details, YAML tabs
    And Details tab is displayed with field names "Name", "Labels", "Annotations", "Created At", "Owner"
    And Actions dropdown display on the top right corner of the page


@regression, @smoke
Scenario: Remove Trigger popup details : P-09-TC10
    Given user is at pipelines page
    And pipeline is provided with trigger
    When user selects "Remove Trigger" from the kebab menu
    Then popup is displayed with header message "Remove Trigger"
    And trigger template dropdown displayed with default selected option "Select Trigger Template"
    And "Remove" button will be disabled


@regression, @smoke
Scenario: Remove Trigger popup details : P-09-TC10
    Given user is at pipelines page
    And trigger is added to the pipeline
    When user selects "Remove Trigger" from the kebab menu
    Then popup is displayed with header message "Remove Trigger"
    And trigger template dropdown displayed with default selected option "Select Trigger Template"
    And "Remove" button will be disabled


@regression, @smoke
Scenario: Remove the trigger from pipelines page : P-09-TC11
    Given user is at pipelines page
    And trigger is added to the pipeline
    When user selects "Remove Trigger" from the kebab menu
    And selet the first option from the Treigger Template drop down field
    And user clicks on Remove button
    Then popup get closed
    And option "Remove Trigger" is not availale in kebab menu


@regression, @manual
Scenario: Start the pipeline from trigger without secret : P-010-TC01
    Given user is at pipelines page


@regression, @manual
Scenario: Start the pipeline with secret from trigger with authentication key : P-010-TC02
    Given user is at pipelines page
    And webhook secret is created and added to workload


@regression, @manual
Scenario: Start the pipeline with secret from trigger without authentication key : P-010-TC03
    Given user is at pipelines page
    And webhook secret is created and added to workload
