@web-terminal
Feature: Persistent Terminal Sessions (Detach to Cloud Shell)
              As a user, I should be able to detach pod terminals to the Cloud Shell drawer
              so that they persist across page navigation

        Background:
            Given user has logged in as basic user
              And user has created or selected namespace "aut-terminal-detach"
              And user can see terminal icon on masthead

        @regression
        Scenario: Detach pod terminal to Cloud Shell drawer: WT-02-TC01
            Given user is on the pod details terminal tab for a running pod
             When user clicks the Detach to Cloud Shell button
             Then user will see the Cloud Shell drawer open
              And user will see a detached session tab with the pod name

        @regression
        Scenario: Detached session persists across navigation: WT-02-TC02
            Given user has a detached terminal session in the Cloud Shell drawer
             When user navigates to a different page
             Then user will still see the detached session tab in the Cloud Shell drawer

        @regression
        Scenario: Close a detached session tab: WT-02-TC03
            Given user has a detached terminal session in the Cloud Shell drawer
             When user clicks the close button on the detached session tab
             Then the detached session tab is removed from the drawer

        @regression
        Scenario: Session limit prevents more than five detached sessions: WT-02-TC04
            Given user has five detached terminal sessions in the Cloud Shell drawer
             Then the Detach to Cloud Shell button is disabled on the pod terminal

        @regression
        Scenario: Close drawer clears all detached sessions: WT-02-TC05
            Given user has a detached terminal session in the Cloud Shell drawer
             When user closes the Cloud Shell drawer
              And user clicks on the Web Terminal icon on the Masthead
             Then user will not see any detached session tabs
