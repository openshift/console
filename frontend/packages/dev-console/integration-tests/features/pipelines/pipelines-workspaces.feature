Feature: Workspaces
    As a user, I want to add or remove secrets details to pipeline

Background:
    Given user has installed OpenShift Pipelines operator
    And user has selected namespace "aut-pipeline-workspaces"
    And user is at pipelines page


@regression, @smoke, @manual
Scenario: Create the pipeline with workspace : P-12-TC01
    Given user is at Edit Yaml page
    When user enters yaml content "pipeline-with-workspaces.yaml" in editor
    And user clicks on create button in Edit Yaml file
    Then user will be redirected to Pipeline Details page with header name "test-workspace-pipeline"


@regression, @manual
Scenario: Types of volume present in shared workspace : P-12-TC02
    Given user created pipeline with workspace
    When user clicks kebab menu for the pipeline "test-workspace-pipeline"
    And user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
    And user selects shared workspaces drop down
    Then user is able to see different shared workspaces like Empty Directory, Config Map, Secret, PVC


@regression, @manual
Scenario: Start the pipeline with Empty workspace : P-12-TC03
    Given user created pipeline with workspace
    When user clicks kebab menu for the pipeline "test-workspace-pipeline"
    And user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
    And user enters first param as "param-1"
    And user selects volume type "Empty Directory" from shared workspaces dorp down
    And user selects Start button
    Then user will be redirected to Pipeline Run Details page


Scenario: Start the pipeline with ConfigMap : P-12-TC04
    Given user created pipeline with workspace
    And user created Config Map using yaml "pipeline-configMap.yaml"
    When user clicks kebab menu for the pipeline "test-workspace-pipeline"
    And user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
    And user enters first param as "param-1"
    And user selects volume type "Config Map" from shared workspaces dorpdown
    And user selects "sensitive-recipe-storage" from Config Map drop down
    And user selects Start button
    Then user will be redirected to Pipeline Run Details page


Scenario: Start the pipeline with Secret : P-12-TC05
    Given user created pipeline with workspace
    And user created Secret using yaml "pipeline-secret.yaml"
    When user clicks kebab menu for the pipeline "test-workspace-pipeline"
    And user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
    And user enters first param as "param-1"
    And user selects volume type "Secret" from shared workspaces dorpdown
    And user selects "secret-password" from Secret drop down
    And user selects Start button
    Then user will be redirected to Pipeline Run Details page


Scenario: Start the pipeline with PVC : P-12-TC06
    Given user created pipeline with workspace
    And user created Secret using yaml "pipeline-secret.yaml"
    When user clicks kebab menu for the pipeline "test-workspace-pipeline"
    And user selects "Start" option from kebab menu for pipeline "test-workspace-pipeline"
    And user enters first param as "param-1"
    And user selects volume type "PVC" from shared workspaces dorpdown
    And user selects "shared-task-storage" from PVC drop down
    And user selects Start button
    Then user will be redirected to Pipeline Run Details page
