@add-flow
Feature: Developer Catalog Page
    As a user, I should be able to use Developer Catalog page to deploy application


    Background:
        Given user is at developer perspective
        And user has created or selected namespace "aut-developer-catalog"


    @smoke, @ToDo
    Scenario: Developer Catalog page - Default view
        Given user is at Add page
        When user clicks on From Catalog card
        Then user will see All Items already selected
        And user will see CI/CD, Databases, Languages, Middleware, Other categories
        And user will see Builder Images, Event Sources, Helm Charts, Operator Backed, Templates types
        And user will see Filter by Keyword field
        And user will see A-Z, Z-A sort by dropdown


    @smoke, @ToDo
    Scenario: Event Sources on default Developer Catalog
        Given user is at Developer Catalog page
        When user clicks on Event Sources type
        Then user will see the cards of Event Sources
        And user will see Filter by Keyword field
        And user will see A-Z, Z-A sort by dropdown


    @smoke, @manual
    Scenario: Event Sources Providers on Developer Catalog
        Given user has installed one or more operators that contribute event sources
        And user is at Developer Catalog page
        When user clicks on Event Sources type
        Then user will see the list of Providers
        And user will see the cards of Event Sources
        And user will see Filter by Keyword field
        And user will see A-Z, Z-A sort by dropdown


    @smoke, @ToDo
    Scenario: Helm Charts on default Developer Catalog
        Given user is at Developer Catalog page
        When user clicks on Helm Charts type
        Then user will see the cards of Helm Charts
        And user will see Filter by Keyword field
        And user will see A-Z, Z-A sort by dropdown


    @smoke, @manual
    Scenario: Helm Charts Repositories on Developer Catalog
        Given user has added multiple helm charts repositories
        And user is at Developer Catalog page
        When user clicks on Helm Charts type
        Then user will see the list of Chart Repositories
        And user will see the cards of Helm Charts
        And user will see Filter by Keyword field
        And user will see A-Z, Z-A sort by dropdown


    @smoke, @manual
    Scenario: Developer Catalog Customization - Add empty Categories
        Given user is at Search page
        When user clicks on Resources dropdown
        And user searches for Console
        And user clicks on Console checkbox with "operator.openshift.io/v1"
        And user clicks on cluster link
        And user navigates to YAML tab
        And user removes everything from spec.customization.developerCatalog.categories
        And user enters "[]" in front of spec.customization.developerCatalog.categories
        And user clicks on Save button
        And user clicks on Reload button
        And user navigates to Developer Catalog page
        Then user will not see Categories


    @smoke, @manual
    Scenario: Developer Catalog - Categories under Schema tab
        Given user is at cluster YAML tab
        When user clicks on View sidebar
        And user clicks on View Details under spec on the sidebar
        And user clicks on View Details under customization on the sidebar
        And user clicks on View Details under developerCatalog on the sidebar
        And user clicks on View Details under categories on the sidebar
        Then user will see categories which are shown in the developer catalog


    @smoke, @manual
    Scenario: Developer Catalog Customization - Edit Categories
        Given user is at cluster YAML tab
        And user has removed all the categories from Developer Catalog page
        And user has entered "[]" in front of spec.customization.developerCatalog.categories
        When user clicks on View sidebar
        And user clicks on Snippets on the sidebar
        And user removes "[]" in front of spec.customization.developerCatalog.categories
        And user clicks on Insert Snippet link on the sidebar
        And user removes Languages Category
        And user clicks on Save button
        And user clicks on Reload button 
        Then user will see all the categories except Languages added under spec.customization.developerCatalog.categories
        And user will see all the categories except Languages on Developer Catalog page
