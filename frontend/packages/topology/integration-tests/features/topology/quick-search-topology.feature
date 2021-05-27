@topology
Feature: Provide quick search from topology/list views to add to project
              As a user, I should be able to have a quick way to search for items to add to my application/project in the Topology List/Graph view

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology"


        @regression @to-do
        Scenario: Add to project button in topology graph view: T-02-TC01
            Given user is at topology list view
             When user clicks on graph view button
             Then user can see Add to project button


        @regression @to-do
        Scenario: Add to project button in topology list view: T-02-TC02
            Given user is at topology graph view
             When user clicks on list view button
             Then user can see Add to project button


        @regression @to-do
        Scenario: Add to project bar in topology graph view: T-02-TC03
            Given user is at topology graph view
             When user clicks Add to project button
             Then user can see Add to project search bar


        @regression @to-do
        Scenario: Add to project bar in topology list view: T-02-TC04
            Given user is at topology graph view
             When user clicks Add to project button
             Then user can see Add to project search bar


        @regression @to-do
        Scenario: Add django application in topology chart view: T-02-TC05
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters django in Add to project search bar
              And user selects django+PostgreSQL option
              And user clicks on instantiate template
              And user clicks on create with default values in Instantiate Template form
              And user can see PostgreSQL and django workload in topology graph view

        @regression @to-do
        Scenario: Add .Net application in topology list view: T-02-TC06
            Given user is at topology list view
             When user clicks Add to project button
              And user enters "net" in Add to project search bar
              And user selects .Net core option
              And user clicks on Create Application
              And user clicks on create with default values in Create Application form
              And user can see .Net workload in topology list view


        @regression @to-do
        Scenario: View all results option for django in topology graph view: T-02-TC07
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "django" in Add to project search bar
              And user clicks on View all results option
             Then user will see Catalog with django text filter


        @regression @to-do
        Scenario: No results for the search: T-02-TC08
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "abcdef" in Add to project search bar
              And user will see No results


        @odc-5010 @regression @to-do
        Scenario: Quick Add of Quick Starts in topology graph view: T-02-TC09
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "monitoring" in Add to project search bar
              And user selects Monitoring your sample application option
              And user clicks on Start
             Then Monitoring your sample application quick start starts in context of the Topology.


        @odc-5010 @regression @to-do
        Scenario: View all Quick Starts option for monitoring in topology graph view: T-02-TC10
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "monitoring" in Add to project search bar
              And user clicks on View all Quick Starts option
             Then user is taken to the search results in context of the Quick Starts Catalog.

