@add-flow @odc-6303
Feature: Provide quick search in Add page
              As a user, I should be able to have a quick way to search for items to add to my application/project in the Add page

        Background:
            Given user is at Add page
              And user has created or selected namespace "aut-add"


        @smoke @to-do
        Scenario: Add to project button in Add page: AQS-01-TC01
             When user clicks Add to project button
             Then user can see Add to project search bar


        @regression @to-do
        Scenario: Add django application from quick search in Add page: AQS-01-TC02
             When user clicks Add to project button
              And user enters "django" in Add to project search bar
              And user selects django+PostgreSQL option
              And user clicks on instantiate template
              And user clicks on create with default values in Instantiate Template form
              And user can see PostgreSQL and django workload in topology view


        @regression @to-do
        Scenario: View all results option for django in Add page: AQS-01-TC03
             When user clicks Add to project button
              And user enters "django" in Add to project search bar
              And user clicks on View all developer catalog items link
             Then user will see Catalog with django text filter


        @regression @to-do
        Scenario: No results for the search: AQS-01-TC04
             When user clicks Add to project button
              And user enters "abcdef" in Add to project search bar
              And user will see No results


        @regression @to-do
        Scenario: Quick Add of Quick Starts: AQS-01-TC05
             When user clicks Add to project button
              And user enters "monitor" in Add to project search bar
              And user selects Monitor your sample application option
              And user clicks on Start
             Then Monitor your sample application quick start displays in the Add page


        @regression @to-do
        Scenario: Quick Add of Devfile: AQS-01-TC06
             When user clicks Add to project button
              And user enters "node" in Add to project search bar
              And user selects Basic NodeJS Devfiles option
              And user clicks on Create Application
              And user clicks on Create button in the Import from Devfile page
             Then user is taken to the Topology page with "devfile-sample-git" workload created
