Feature: Developer Catalog Page
    As a user, I should be able to use Developer Catalog page to deploy application


    Background:
        Given user is at developer perspective
    

    @smoke
    Scenario: Developer Catalog page
        Given user is at Add page
        When user clicks on From Catalog card
        Then user will see All Items already selected
        And user will see CI/CD, Databases, Languages, Middleware, Other categories
        And user will see Builder Images, Event Sources, Helm Charts, Operator Backed, Templates types
        And user will see Filter by Keyword field
        And user will see A-Z, Z-A sort by dropdown

    
    @smoke
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


    @smoke
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
