@topology
Feature: Provide quick search from topology/list views to add to project
              As a user, I should be able to have a quick way to search for items to add to my application/project in the Topology List/Graph view

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology"


        @regression
        Scenario: Add to project button in topology graph view: T-02-TC01
            Given user created a workload and is at topology list view
             When user clicks on graph view button
             Then user can see Add to project button


        @regression
        Scenario: Add to project button in topology list view: T-02-TC02
            Given user is at topology graph view
             When user clicks on list view button
             Then user can see Add to project button


        @regression
        Scenario: Add to project bar in topology graph view: T-02-TC03
            Given user is at topology graph view
             When user clicks Add to project button
             Then user can see Add to project search bar


        @regression
        Scenario: Add to project bar in topology list view: T-02-TC04
            Given user is at topology list view
             When user clicks Add to project button
             Then user can see Add to project search bar


        @regression
        Scenario: Add django application in topology chart view: T-02-TC05
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "django" in Add to project search bar
              And user selects django+PostgreSQL option
              And user clicks on instantiate template
              And user clicks on create with default values in Instantiate Template form
             Then user can see "PostgreSQL" and "django" workload in topology graph view

        @regression
        Scenario: Add .Net application in topology list view: T-02-TC06
            Given user is at topology list view
             When user clicks Add to project button
              And user enters "net" in Add to project search bar
              And user selects .Net core option
              And user clicks on Create Application
              And user clicks on create with default values in Create Application form
             Then user can see "dotnet" workload in topology list view


        @regression
        Scenario: View all results option for django in topology graph view: T-02-TC07
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "django" in Add to project search bar
              And user clicks on View all software catalog items link
             Then user will see Catalog with "django" text filter


        @regression
        Scenario: No results for the search: T-02-TC08
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "abcdef" in Add to project search bar
             Then user will see No results


        @regression
        Scenario: Quick Add of Quick Starts in topology graph view: T-02-TC09
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "monitor your sample application" in Add to project search bar
              And user selects Monitor your sample application option
              And user clicks on Start button
             Then Monitor your sample application quick start displays in the Topology


        @regression
        Scenario: View all Quick Starts option for pipeline in topology graph view: T-02-TC10
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "pipeline" in Add to project search bar
              And user clicks on View all quick starts link
             Then user will be redirected to the search results of the Quick Starts Catalog


        @regression
        Scenario: Quick Add of Devfile in topology graph view: T-02-TC011
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "node" in Add to project search bar
              And user selects Basic NodeJS Devfiles option
              And user clicks on Create Application
              And user enters Name as "devfile-sample-git" in Import from Devfile page
              And user clicks on Create button in the Import from Devfile page
             Then user is taken to the Topology page with "devfile-sample-git" workload created


        @regression
        Scenario: Quick Add of Devfile Sample in topology graph view: T-02-TC012
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "node" in Add to project search bar
              And user selects Basic NodeJS Samples option
              And user clicks on Create Devfile Samples
              And user enters Name as "basic-nodejs-sample-ex1" in Import from Devfile page
              And user clicks on Create button in the Import from Devfile page
             Then user is taken to the Topology page with "basic-nodejs-sample-ex1" workload created


        @regression
        Scenario: View all Samples option for node in topology graph view: T-02-TC13
            Given user is at topology graph view
             When user clicks Add to project button
              And user enters "node" in Add to project search bar
              And user clicks on View all Samples link
             Then user is taken to the search results in context of the Samples page
