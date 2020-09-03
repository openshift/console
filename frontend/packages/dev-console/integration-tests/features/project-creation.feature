Feature: project namespace
    As a user, I want to create the project to group and isolate related objects

@e2e, @4.5
Scenario Outline: Create the project namespace
    Given user is at developer perspecitve
    When user selects the Create Project option from Projects dropdown on top navigation bar
    And type Name as "<project_name>" in Create Project popup
    And click Create button present in Create Project popup
    Then popup should get closed
    And topology page displays with message "No workloads found"
    And topology page have cards from Add page

Examples:
| project_name   |
| aut-mb-project |
