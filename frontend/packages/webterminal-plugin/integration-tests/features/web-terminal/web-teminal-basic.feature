@web-terminal
Feature: Web Terminal
              As a basic user, I should be able to use web terminal

        Background:
            Given user has logged in as basic user
              # And user has installed webTerminal in namespace "aut-terminal-basic"
              And user has created or selected namespace "aut-terminal-basic"

        @regression
        Scenario: Open existing Web Terminal instance: WT-01-TC01
             When user clicks on the Web Terminal icon on the Masthead
              And user clicks advanced option for Timeout
              And user sets timeout to "1" Minute
              And user clicks on Start button
             Then user will see the terminal window
              And user close current Web Terminal session

        @regression
        Scenario: Web Terminal in new tab: WT-01-TC02
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
              And user clicks on Open Terminal in new tab button on the terminal window
             Then user will see the terminal window opened in new tab

        @regression
        Scenario: Web Terminal is stopped by inactivity: WT-01-TC03
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
             Then user will see the terminal window
              And user does nothing with displayed terminal window 1 minutes
             Then user will be informed that terminal is closed by inactivity and is proposed to restart it
