@web-terminal
Feature: Web Terminal for Developer user
              As a developer user, I should be able to use web terminal


        Background:
            Given user has logged in as basic user
              And user has installed Web Terminal operator
              And user is at developer perspective


        @regression
        Scenario: Create new project and use Web Terminal: WT-03-TC01
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
              And user selects Create Project from Project drop down menu
              And user enters project name "aut-terminal-testuser"
              And user clicks on Submit button
             Then user will see the terminal window for namespace "aut-terminal-testuser"


        @regression
        Scenario: Open Web Terminal for existing project: WT-03-TC02
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
              And user selects "aut-terminal-testuser" from Project drop down menu
             Then user will see the terminal window for namespace "aut-terminal-testuser"
