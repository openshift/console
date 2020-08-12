Feature: Create the pipeline from builder page
    As a user I want to create the pipeline with different set of series & parallel tasks 

Background:
    Given openshift cluster is installed with pipeline operator
    And user is at the project namespace "aut-pipelines-builder" in dev perspecitve


@regression, @smoke
Scenario Outline: Create a basic pipeline from pipeline builder page : P-03-TC08
    Given user is at Pipeline Builder page 
    When user types pipeline name as "<pipeline_name>"
    And select "<task_name>" from Task drop down
    And clicks Create button on Pipeline Builder page
    Then user redirects to Pipeline Details page with header name "<pipeline_name>"

Examples:
| pipeline_name | task_name |
| pipelines-one | kn        | 


@regression, @smoke
Scenario Outline: Create a pipeline with parallel tasks : P-03-TC03, P-07- TC02
    Given user is at Pipeline Builder page 
    When user types pipeline name as "<pipeline_name>"
    And select "<task_name>" from Task drop down
    And user adds another task "<task_name_1>" in parallel
    And clicks Create button on Pipeline Builder page
    Then user redirects to Pipeline Details page with header name "<pipeline_name>"
    And tasks displayed parallel in pipelines section

Examples:
| pipeline_name | task_name | task_name_1      |
| pipelines-one | kn        | openshift-client |


@regression, @smoke
Scenario: Pipeline Builder page : P-03-TC02
    Given user is at pipelines page 
    When user clicks Create Pipeline button on Pipelines page
    Then user redirects to Pipeline Builder page
    And Name displayed wtih default value new-pipeline
    And Tasks, Paramters and Resources sections are displayed
    And Edit Yaml link is enabled
    And Create button is in disabled state


@regression
Scenario Outline: Create pipeline with "<resource_type>" as resource type from pipeline builder page : "<tc_no>"
    Given user is at Pipeline Builder page 
    When user types pipeline name as "<pipeline_name>"
    And select "<task_name>" from Task drop down
    And add "<resource_type>" resource with name "<resource_name>" to the "<task_name>"
    And user clicks "Create" button on Pipeline Builder page
    Then user redirects to Pipeline Details page with header name "<pipeline_name>"
    And task details present in pipeline details section

Examples:
| pipeline_name     | task_name        | resource_type | resource_name | tc_no     |
| pipelines-two     | openshift-client | Git           | git repo      | P-03-TC11 |
| pipelines-img     | task-image       | Image         | image repo    | P-03-TC05 |
| pipelines-storage | task-storage     | Storage       | storage repo  | P-03-TC06 |
| pipelines-cluster | task-cluster     | Cluster       | cluster repo  | P-03-TC07 |


Scenario: Add Paramters to the pipeline in pipeline builder page : P-03-TC04
    Given user is at Pipeline Builder page 
    When user clicks on "Add Paramters" link
    And add the parameter details like Name, Description and Default Value
    And user clicks "Create" button on Pipeline Builder page
    Then user redirects to Pipeline Details page with header name "<pipeline_name>"
    And parameter details displayed in parameters section


@regression
Scenario Outline: Create a pipeline with series tasks : P-07-TC03
    Given user is at Pipeline Builder page 
    When user types pipeline name as "<pipeline_name>"
    And select "<task_name>" from Task drop down
    And user adds another task "<task_name_1>" in series
    And clicks Create button on Pipeline Builder page
    Then user redirects to Pipeline Details page with header name "<pipeline_name>"
    And tasks displayed serially in pipelines section

Examples:
| pipeline_name | task_name | task_name_1 |
| pipelines-one | kn        | Sn          |


@regression, @manual
Scenario: Create the pipeline from yaml editor : P-07- TC01
    Given user is at Pipeline Builder page
    When user clicks Edit YAML button
    And clicks Continue on Switch to YAML editor
    And clicks Create button on Pipeline Yaml page
    Then user redirects to Pipeline Details page
