@pipelines
Feature: Create the pipeline from builder page
              As a user, I want to create the pipeline with different set of series & parallel tasks

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-pipelines-buidler"
              And user is at Add page


        @regression
        Scenario: Pipeline Builder page : P-03-TC02
            Given user is at pipelines page
             When user clicks Create Pipeline button on Pipelines page
             Then user will be redirected to Pipeline Builder page
              And user is able to see pipeline name with default value "new-pipeline"
              And Tasks, Parameters and Resources sections are displayed
        # And Edit Yaml link is enabled - Edit Yaml button is removed, so now we are verifying Yaml view radio button
              And Yaml view configuration is displayed
              And Create button is in disabled state


        @regression
        Scenario Outline: Create a pipeline with series tasks : P-07-TC03
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user adds another task "<task_name_1>" in series
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name | task_name_1      |
                  | p-one         | kn        | openshift-client |


        @regression
        Scenario Outline: Create a pipeline with parallel tasks : P-07-TC02
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user adds another task "<task_name_1>" in parallel
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name | task_name_1      |
                  | p-two         | kn        | openshift-client |


        @smoke
        Scenario Outline: Create a basic pipeline from pipeline builder page : P-03-TC08
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name |
                  | p-three       | kn        |


        Scenario Outline: Create pipeline with "<resource_type>" as resource type from pipeline builder page : "<tc_no>"
            Given user is at Pipeline Builder page
             When user enters pipeline name as "<pipeline_name>"
              And user selects "<task_name>" from Task drop down
              And user adds "<resource_type>" resource with name "<resource_name>" to the "<task_name>"
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

        Examples:
                  | pipeline_name | task_name        | resource_type | resource_name | tc_no     |
                  | p-git         | openshift-client | Git           | git repo      | P-03-TC11 |
                  | p-img         | task-image       | Image         | image repo    | P-03-TC05 |
                  | p-storage     | task-storage     | Storage       | storage repo  | P-03-TC06 |
                  | p-cluster     | task-cluster     | Cluster       | cluster repo  | P-03-TC07 |


        @regression, @manual
        Scenario: Add Parameters to the pipeline in pipeline builder page : P-03-TC04
            Given user is at Pipeline Builder page
             When user enters pipeline name as "pipeline-params"
              And user selects "s2i-nodejs" from Task drop down
              And user clicks on "Add Parameters" link
              And user adds the parameter details like Name, Description and Default Value
              And user clicks Create button on Pipeline Builder page
             Then user will be redirected to Pipeline Details page with header name "pipeline-params"


        @regression, @manual
        Scenario: Create the pipeline from yaml editor : P-07-TC01
            Given user is at Pipeline Builder page
             When user clicks Edit YAML button
              And user clicks Continue on Switch to YAML editor
              And user clicks Create button on Pipeline Yaml page
             Then user will be redirected to Pipeline Details page with header name "new-pipeline"
