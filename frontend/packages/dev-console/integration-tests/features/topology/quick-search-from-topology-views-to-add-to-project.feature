@topology
Feature: Provide quick search from topology/list views to add to project
              As a user, I should be able to have a quick way to search for items to add to my application/project in the Topology List/Graph view

        Background:
            Given user is at developer perspective
              And user has selected "aut-quick-search" namespace


        @regression
        Scenario: Add to project button in topology graph view
            Given user is at topology list view
             When user clicks on graph view button
             Then user can see Add to project button


        @regression
        Scenario: Add to project button in topology list view
            Given user is at topology graph view
             When user clicks on list view button
             Then user can see Add to project button


        @regression
        Scenario: Add to project bar in topology graph view
            Given user is at topology graph view
             When user clicks Add to project button
             Then user can see Add to project search bar


        @regression
        Scenario: Add to project bar in topology list view
            Given user is at topology graph view
             When user clicks Add to project button
             Then user can see Add to project search bar


        @regression
        Scenario: Add django application in topology chart view
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters django in Add to project search bar
              And user selects django+PostgreSQL option
              And user clicks on instantiate template
              And user clicks on create with default values in Instantiate Template form
              And user can see PostgreSQL and django workload in topology graph view


        @regression
        Scenario: Add .Net application in topology list view
            Given user is at topology list view
             When user clicks Add to project button
              And user enters "net" in Add to project search bar
              And user selects .Net core option
              And user clicks on Create Application
              And user clicks on create with default values in Create Application form
              And user can see .Net workload in topology list view


        @regression
        Scenario: View all results option for django in topology graph view
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "django" in Add to project search bar
              And user clicks on View all results option
             Then user will see Catalog with django text filter


        @regression
        Scenario: No results for the search
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "abcdef" in Add to project search bar
              And user will see No results
