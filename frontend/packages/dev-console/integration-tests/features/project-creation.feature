Feature: OpenShift Namespaces
    As a user, I want to create the namespace to group and isolate related objects

@e2e, @4.5
Scenario Outline: Create the namespace
    Given user is at developer perspecitve
    When user selects the Create Project option from Projects dropdown on top navigation bar
    And user enters project name as "<project_name>" in Create Project modal
    And user clicks Create button present in Create Project modal
    Then modal will get closed
    And topology page displays with message "No workloads found"
    And topology page have cards from Add page

Examples:
| project_name   |
| aut-mb-project |
