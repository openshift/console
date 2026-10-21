@add-flow @dev-console
Feature: Software Catalog with All Namespaces in Dev Perspective
              As a developer, when I visit the catalog with all namespaces selected, I should see the project selection page instead of the catalog

        Background:
            Given user is at developer perspective

        @regression
        Scenario: Software Catalog forces project selection when all namespaces URL is accessed: A-12-TC01
             When user navigates to catalog all namespaces page
             Then user will see "Software Catalog" page heading
              And user will see "Select a Project to view the software catalog" help text
              And user will not see catalog tiles or items

        @regression
        Scenario: Software Catalog shows catalog items when specific project is selected: A-12-TC02
            Given user has created or selected namespace "aut-catalog-namespaces"
              And user is at Software Catalog page
             Then user will see "Software Catalog" page heading
              And user will see catalog tiles or items
              And user will not see "Select a Project to view the software catalog" help text
