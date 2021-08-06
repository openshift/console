@odc-5227
Feature: Manage user preferences
              As a user, I need the ability to set/edit my preferences for the OCP Console.


        Background:
            Given user is at developer perspective


        @regression @to-do
        Scenario: Setting Developer preference for perspective: UP-01-TC01
            Given user is at admin perspective
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user changes user preference "Perspective" dropdown to "Developer"
              And user reloads the console without perspective.
             Then user sees the "Developer" perspective


        @regression @to-do
        Scenario: Setting a preference for a project: UP-01-TC02
            Given user has created project "test-preference1"
             When user selects "All projets" from the project menu
              And user clicks on user dropdown on masthead and selects "User Preference"
              And user clicks on Project dropdown on User Preferences page
              And user searches and selects project "test-preference1" from the dropdown
              And user reloads the console
             Then user can see project "test-preference1" is selected


        @regression @to-do
        Scenario: Creating project with project preference: UP-01-TC03
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user clicks on Project dropdown on User Preferences page
              And user types project "test-preference2" in search bar
              And user clicks on the Create project option from the dropdown
              And user reloads the console
              And user can see project "test-preference2" is selected


        @regression @to-do
        Scenario: Setting Graph preference for Topology: UP-01-TC04
            Given user has created or selected namespace "aut-user-preferences"
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user changes user preference "Topology" dropdown to "Graph"
              And user clicks on Topology in navigation menu
             Then user can see topology graph view


        @regression @to-do
        Scenario: Setting List preference for Topology: UP-01-TC05
            Given user has created or selected namespace "aut-user-preferences"
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user changes user preference "Topology" dropdown to "List"
              And user clicks on Topology in navigation menu
             Then user can see topology list view


        @regression @to-do
        Scenario: Setting Form preference for Create/Edit resource method: UP-01-TC06
            Given user has created or selected namespace "aut-user-preferences"
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user changes user preference "Create/Edit resource method" dropdown to "Form"
              And user clicks on Add in navigation menu
              And user clicks on Helm charts
              And user selects "Nodejs v0.0.1" helm chart
              And user clicks on Install Helm Chart button
             Then user can see Form view option selected in Install Helm Chart page


        @regression @to-do
        Scenario: Setting YAML preference for Create/Edit resource method: UP-01-TC07
            Given user has created or selected namespace "aut-user-preferences"
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user changes user preference "Create/Edit resource method" dropdown to "YAML"
              And user clicks on Add in navigation menu
              And user clicks on Helm charts
              And user selects "Nodejs v0.0.1" helm chart
              And user clicks on Install Helm Chart button
             Then user can see YAML view option selected in Install Helm Chart page
