@add-flow
Feature: Developer Catalog Page
              As a user, I should be able to use Developer Catalog page to deploy application


        Background:
            Given user has installed OpenShift Serverless Operator
              And user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-addflow-pagedetails"


        @regression
        Scenario: Developer Catalog page - Default view: A-09-TC01
             When user clicks on From Catalog card
             Then user will see All Items already selected
              And user will see CICD, Databases, Languages, Middleware, Other categories
              And user will see Builder Images, Event Sources, Helm Charts, Operator Backed, Templates types
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown


        Scenario Outline: Filter the cards with type: A-09-TC02
            Given user is at Developer Catalog page
             When user selects "<type>" option from Type section
             Then user is able to see cards related to "<type>"

        Examples:
                  | type           |
                  | Helm Charts    |
                  | Builder Images |
                  | Template       |


        Scenario: Filter the catalog using GroupBy option: A-09-TC03
            Given user is at Developer Catalog page
             When user searches "node" card from catalog page
             Then user is able to see cards with name containing "node"


        @smoke
        Scenario: Event Sources on default Developer Catalog: A-09-TC04
            Given user is at Developer Catalog page
             When user clicks on Event Sources type
             Then user will see the cards of Event Sources
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown


        @smoke
        Scenario: Helm Charts on default Developer Catalog: A-09-TC06
            Given user is at Developer Catalog page
             When user clicks on Helm Charts type
             Then user will see the cards of Helm Charts
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown


        @smoke @manual
        Scenario: Helm Charts Repositories on Developer Catalog: A-09-TC07
            Given user has added multiple helm charts repositories
              And user is at Developer Catalog page
             When user clicks on Helm Charts type
             Then user will see the list of Chart Repositories
              And user will see the cards of Helm Charts
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown


        @smoke @manual
        Scenario: Developer Catalog Customization - Add empty Categories: A-09-TC08
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


        @smoke @manual
        Scenario: Developer Catalog - Categories under Schema tab: A-09-TC09
            Given user is at cluster YAML tab
             When user clicks on View sidebar
              And user clicks on View Details under spec on the sidebar
              And user clicks on View Details under customization on the sidebar
              And user clicks on View Details under developerCatalog on the sidebar
              And user clicks on View Details under categories on the sidebar
             Then user will see categories which are shown in the developer catalog


        @smoke @manual
        Scenario: Developer Catalog Customization - Edit Categories: A-09-TC10
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
