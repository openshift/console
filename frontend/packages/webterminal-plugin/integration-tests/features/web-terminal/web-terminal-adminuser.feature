@web-terminal
Feature: Web Terminal for Admin user
              As a user with admin rights, I should be able to use web terminal


        Background:
            Given user has logged in as admin user
              And user is at developer perspective
            #   And user has created or selected namespace "aut-terminal"


        @regression @odc-6463
        Scenario Outline: User is able to open and close multiple terminals in the cloudshell: WT-02-TC01
            Given  user can see terminal icon on masthead
             When  user clicks on the Web Terminal icon on the Masthead
              And  user opens <number_of_terminals> additional web terminal tabs
              And  user closed "<closed_terminal>" web terminal tab
             Then  user is able see <open_terminals> web terminal tabs
              And  user closed web terminal window

        Examples:
                  | number_of_terminals | closed_terminal | open_terminals |
                  | 3                   | 2nd             | 3              |
                  

        @smoke @odc-6745
        Scenario: Create new project with timeout and use Web Terminal: WT-02-TC02
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
              And user clicks advanced option for Timeout
              And user sets timeout to "10" Minute
              And user clicks on Start button
             Then user will see the terminal instance for namespace "openshift-terminal"
              And user ID obtained by API should match with user id in yaml editor for "openshift-terminal" namespace
              And user has closed existing terminal workspace


        @smoke @odc-6745
        Scenario: Create new project and use Web Terminal: WT-02-TC03
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
              And user clicks on Start button
             Then user will see the terminal window
              And user will see the terminal instance for namespace "openshift-terminal"
              And user ID obtained by API should match with user id in yaml editor for "openshift-terminal" namespace
              And user has closed existing terminal workspace

