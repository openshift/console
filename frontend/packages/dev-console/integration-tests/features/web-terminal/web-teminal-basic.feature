@web-terminal
Feature: Web Terminal
              As a user, I should be able to use web terminal


        Background:
            Given user has installed Web Terminal operator
              And user is at developer perspective
              And user has created or selected namespace "aut-terminal-basic"


        @smoke @to-do
        Scenario: Web Terminal window: WT-01-TC01
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
             Then user will see the terminal window


        @regression @to-do
        Scenario: Web Terminal in new tab: WT-01-TC02
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
              And user clicks on Open Terminal in new tab button on the terminal window
             Then user will see the terminal window opened in new tab
