Feature: Create Application from YAML file
    As a user, I want to create the application, component or service from Yaml file using Add Flow 

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-addflow-yaml"


@regression-1
Scenario: Create a workload from YAML file : A-07-TC01
    Given user is at Import YAML page
    When user clicks on create button with default YAML
    Then user will be redirected to Topology page
    And user is able to see workload "mariadb" in topology page
 

@regression
Scenario: Perform cancel operation on YAML file : A-07-TC02
    Given user is at Import YAML page
    When user clicks on cancel button with default YAML
    Then user will be redirected to Add page
