@guided-tour
Feature: Add ability to filter Quick Starts catalog
              As a user, i want to be able to filter Quick Starts in the catalog by status of the Quick Starts and search Quick Starts catalog by name, description, tags and prerequisites.

        Background:
            Given user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-filter-quickstarts"


        @smoke
        Scenario: Quick Starts Catalog Page: QS-01-TC01
            Given user is at Add page
             When user clicks on "View all quick starts" on Build with guided documentation card
             Then user can see Quick Starts catalog page
              And user can see filter by keyword search bar
              And user can see Status filter dropdown


        @regression
        Scenario: Filter by keyword: QS-01-TC02
            Given user is at Quick Starts catalog page
             When user clicks on filter by keyword search bar
              And user enters "pipeline"
             Then user can see "Install the OpenShift Pipelines Operator" Quick Start


        @regression
        Scenario: Filter based on status: QS-01-TC03
            Given user is at Quick Starts catalog page
             When user clicks on Status filter menu
             Then user can see Complete, In progress and Not started categories


        @regression
        Scenario: Apply Filter based on status: QS-01-TC04
            Given user is at Quick Starts catalog page
              And user has completed "Getting started with a sample application" Quick Start
             When user clicks on Status filter menu
              And user clicks on completed
             Then user can see "Getting started with a sample application" Quick Start is present


        @regression
        Scenario: No result condition for filter: QS-01-TC05
            Given user is at Quick Starts catalog page
             When user clicks on filter by keyword search bar
              And user enters "asdf"
             Then user can see "No results found" message
              And user can see Clear all filters option
