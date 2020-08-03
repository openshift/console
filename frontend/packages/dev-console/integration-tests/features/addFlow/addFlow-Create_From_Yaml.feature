Feature: Create Application from Yaml file
    As a user I want to create the application, component or service from Add Flow Yaml file

Background:
    Given user is at dev perspecitve
    And open project namespace "aut-addflow-yaml"


@regression
Scenario: Create a workload from Yaml file : A-07-TC01
    Given user is at Import YAML page
    When user clicks on create button wtih default yaml
    Then user redirects to Topology page
    And created workload "mariadb" is present in topology page
 

@regression
Scenario: Perform cancel operation on Yaml file : A-07-TC02
    Given user is at Import YAML page
    When user clicks on cancel button wtih default yaml
    Then user redirects to Add page
