@web-terminal
Feature: Web Terminal for Developer user
              As a developer user, I should be able to use web terminal

        Background:
            Given user has logged in as dev user
              # for correct checking of the user story we can use just an one project with active terminal
              # we use 2 different namespace (projects) for avoiding conflicts
              # 1. `aut-terminal-testuser` for creation, starting and removing DevWorkspace
              # 2. `aut-terminal-testuser-existed2` for creation DevWorkspace in existed project
              # in existed project
              And user has created or selected namespace "aut-terminal-testuser-existed"
              And user has installed Web Terminal operator

        @regression @to-do
        Scenario: Create new project and use Web Terminal: WT-03-TC01
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
              And user selects Create Project from Project drop down menu
              And user enters project name "aut-terminal-testuser"
              And user clicks on Submit button
             Then user will see the terminal window
             Then user will see the terminal instance for developer namespace "aut-terminal-testuser"

        @regression @to-do
        Scenario: Open Web Terminal for existing project WT-03-TC02
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
              And user selects "aut-terminal-testuser-existed" from Project drop down menu
             Then user will see the terminal instance for developer namespace "aut-terminal-testuser-existed"
