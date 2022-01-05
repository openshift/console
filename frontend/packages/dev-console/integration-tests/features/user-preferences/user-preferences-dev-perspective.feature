Feature: Manage user preferences
              As a user, I need the ability to set/edit my preferences for the OCP Console.


        Background:
            Given user is at developer perspective
              And user is at Add page


        @smoke
        Scenario: Visiting User Preference page: UP-01-TC01
            Given user is at admin perspective
             When user clicks on user dropdown on masthead and selects "User Preference"
             Then user sees "General" tab selected on User Preferences page
              And user sees "Language" tab on User Preferences page

        @regression
        Scenario: Setting Developer preference for perspective: UP-01-TC02
            Given user is at admin perspective
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user changes user preference "Perspective" dropdown to "Developer"
              And user reloads the console without perspective
             Then user sees the "Developer" perspective


        @regression
        Scenario: Setting a preference for a project: UP-01-TC03
            Given user has created project "test-preference111"
             When user selects "All Projects" from the project menu
              And user clicks on user dropdown on masthead and selects "User Preference"
              And user clicks on "Project" dropdown on User Preferences page
              And user searches and selects project "test-preference11" from the dropdown
              And user reloads the console
             Then user can see project "test-preference111" is selected


        @regression
        Scenario: Creating project with project preference: UP-01-TC04
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user clicks on "Project" dropdown on User Preferences page
              And user types project "test-preference222" in search bar
              And user clicks on Create project option from the dropdown
              And user clicks on Create with name "test-preference222" in Create Project modal
              And user reloads the console
              And user can see project "test-preference222" is selected


        @regression
        Scenario: Setting Graph preference for Topology: UP-01-TC05
            Given user has created or selected namespace "aut-user-preferences"
              And user has created workload "node1" with resource type "deployment"
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user changes user preference "Topology" dropdown to "Graph"
              And user reloads the console
              And user clicks on Topology in navigation menu
             Then user can see topology graph view


        @regression @broken-test
        # marked broken-test due to bug https://bugzilla.redhat.com/show_bug.cgi?id=2014313
        Scenario: Setting List preference for Topology: UP-01-TC06
            Given user has created or selected namespace "aut-user-preferences"
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user changes user preference "Topology" dropdown to "List"
              And user reloads the console
              And user clicks on Topology in navigation menu
             Then user can see topology list view


        @regression
        Scenario: Setting Form preference for Create/Edit resource method: UP-01-TC07
            Given user has created or selected namespace "aut-user-preferences"
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user changes user preference "Create/Edit resource method" dropdown to "Form"
              And user clicks on Add in navigation menu
              And user clicks on Helm charts
              And user selects "Nodejs" helm chart
              And user clicks on Install Helm Chart button
             Then user can see Form view option selected in Install Helm Chart page


        @regression
        Scenario: Setting YAML preference for Create/Edit resource method: UP-01-TC08
            Given user has created or selected namespace "aut-user-preferences"
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user changes user preference "Create/Edit resource method" dropdown to "YAML"
              And user clicks on Add in navigation menu
              And user clicks on Helm charts
              And user selects "Nodejs" helm chart
              And user clicks on Install Helm Chart button
             Then user can see YAML view option selected in Install Helm Chart page


        @regression
        Scenario: Setting a preference for language: UP-01-TC09
            Given user is at admin perspective
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user clicks on "Language" tab on User Preferences page
              And user clicks on the checkbox to uncheck it
              And user changes user preference "Language" dropdown to "日本語"
             Then user will see the language change to 日本語


        @regression @odc-6303
        Scenario: Setting Routing options preference for import form: UP-01-TC07
            Given user has created or selected namespace "aut-user-preferences"
             When user clicks on user dropdown on masthead and selects "User Preference"
              And user deselects the checkbox of user preference "Secure Route"
              And user clicks on Add in navigation menu
              And user clicks on Import from Git card
              And user enters Git Repo URL as "https://github.com/sclorg/nodejs-ex.git"
              And user enters name as "node-route" in General section
              And user clicks "Show advanced Routing options" link in Advanced Options section
             Then user is able to see "Secure Route" checkbox is deselected
