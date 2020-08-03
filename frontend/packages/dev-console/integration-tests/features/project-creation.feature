Feature: project namespace
    As a user I want to create the project to group and isolate related objects

Background:
    Given user is logged into the openshift application

@e2e, @4.5
Scenario Outline: Create the project namespace
    Given user is on dev perspective
    When user selects the Create Project option from Projects dropdown on top navigation bar
    And type Name as "<project_name>" in Create Project popup
    And click Create button present in Create Project popup
    Then popup should get closed
    And page displays with message "No workloads found"

Examples:
| project_name  | display_name |
| aut-m-project | automation1  |
