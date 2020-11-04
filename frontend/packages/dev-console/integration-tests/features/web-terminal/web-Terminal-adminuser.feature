Feature: Web Terminal for Admin user
    As a user with admin rights, I should be able to use web terminal


Background:
    Given user has logged in as admin user
    And user has installed Web Terminal operator
    And user is at developer perspecitve


@regression, @smoke
Scenario: Create new project and use Web Terminal
    Given user can see terminal icon on masthead
    When user clicks on the Web Terminal icon on the Masthead
    And user selects Create Project from Project drop down menu
    And user enters project name "aut-terminal-adminuser"
    And user clicks on Submit button
    Then user will see the terminal window for namespace "aut-terminal-adminuser"


@regression, @smoke
Scenario: Open Web Terminal for existing project
    Given user can see terminal icon on masthead
    When user clicks on the Web Terminal icon on the Masthead
    And user selects "aut-terminal-adminuser" from Project drop down menu
    Then user will see the terminal window for namespace "aut-terminal-adminuser"
