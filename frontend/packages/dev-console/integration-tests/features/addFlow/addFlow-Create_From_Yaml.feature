Feature: Create Application from Yaml file
    As a user I want to create the application, component or service from Add Flow Yaml file

Background:
    Given user logged into the openshift application
    And user is on dev perspecitve
    And open project namespace "AUT_AddFlow_Yaml_Demo"


@regression, @smoke
Scenario: Create a workload from Yaml file : A-07-TC01
    Given user is on Import YAML page
    When user clicks on create button wtih default yaml
    Then user redirects to topology page
    And workload is displayed in topology page
 

@regression
Scenario: Perform cancel operation on Yaml file : A-07-TC02
