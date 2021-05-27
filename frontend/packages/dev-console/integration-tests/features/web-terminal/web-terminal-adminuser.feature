@web-terminal
Feature: Web Terminal for Admin user
              As a user with admin rights, I should be able to use web terminal


        Background:
            Given user has logged in as admin user
              And user has installed Web Terminal operator
              And user is at developer perspective


        @smoke @tod-do
        Scenario: Create new project and use Web Terminal: WT-02-TC01
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
             Then user will see the terminal window for namespace "openshift-terminal"


        @regression @tod-do
        Scenario: Open Web Terminal for existing project: WT-02-TC02
            Given user can see terminal icon on masthead
             When user clicks on the Web Terminal icon on the Masthead
             Then user will see the terminal window for namespace "openshift-terminal"
