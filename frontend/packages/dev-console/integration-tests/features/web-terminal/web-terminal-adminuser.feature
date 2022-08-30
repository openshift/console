@web-terminal
Feature: Web Terminal for Admin user
              As a user with admin rights, I should be able to use web terminal


        Background:
            Given user has logged in as admin user
              # Error while installing WTO operator because of DWO https://issues.redhat.com/browse/WTO-127
              And user has installed Web Terminal operator

        @smoke
        Scenario: Create new project and use Web Terminal: WT-02-TC01
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
             Then user will see the terminal window
             Then user will see the terminal instance for namespace "openshift-terminal"
              And user ID obtained by API should match with user id in yaml editor for "openshift-terminal" namespace

        @regression @odc-6463
        Scenario Outline: User is able to open and close multiple terminals in the cloudshell: WT-02-TC02
            Given  user can see terminal icon on masthead
             When  user clicks on the Web Terminal icon on the Masthead
              And  user opens <number_of_terminals> additional web terminal tabs
              And  user closed "<closed_terminal>" web terminal tab
             Then  user is able see <open_terminals> web terminal tabs

        Examples:
                  | number_of_terminals | closed_terminal | open_terminals |
                  | 3                   | 2nd             | 3              |
                  
