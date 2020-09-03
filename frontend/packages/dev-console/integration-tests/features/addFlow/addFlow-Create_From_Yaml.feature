Feature: Create Application from Yaml file
    As a user, I want to create the application, component or service from Add Flow Yaml file

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-addflow-yaml"


@regression
Scenario: Create a workload from Yaml file : A-07-TC01
    Given user is at Import YAML page
    When user clicks on create button wtih default yaml
    Then user will be redirected to Topology page
    And user is able to see workload "mariadb" in topology page
 

@regression
Scenario: Perform cancel operation on Yaml file : A-07-TC02
    Given user is at Import YAML page
    When user clicks on cancel button wtih default yaml
    Then user will be redirected to Add page
