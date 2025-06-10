@add-flow @dev-console
Feature: Software Catalog Page
              As a user, I should be able to use Software Catalog page to deploy application


        Background:
            Given user is at admin perspective
              And user is at Software Catalog page in admin page
              And user has created or selected namespace "aut-catalog-pagedetails"


        @regression
        Scenario: Software Catalog page - Default view: A-09-TC01
             Then user will see All Items already selected
              And user will see CICD, Databases, Languages, Middleware, Other categories
              And user will see 'BuilderImage', 'Devfile', 'HelmChart', 'Template' types
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown


        @regression
        Scenario Outline: Filter the cards with type: A-09-TC02
             When user selects "<type>" option from Type section
             Then user is able to see cards related to "<type>"

        Examples:
                  | type           |
                  | Helm Charts    |
                  | Builder Image  |
                  | Template       |


        @smoke
        Scenario: Helm Charts on default Software Catalog: A-09-TC06
             When user clicks on Helm Charts type
             Then user will see the cards of Helm Charts
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown


        @smoke @manual
        Scenario: Helm Charts Repositories on Software Catalog: A-09-TC07
            Given user has added multiple helm charts repositories
             When user clicks on Helm Charts type
             Then user will see the list of Chart Repositories
              And user will see the cards of Helm Charts
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown


        @smoke @manual
        Scenario: Software Catalog Customization - Add empty Categories: A-09-TC08
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
              And user navigates to Software Catalog page
             Then user will not see Categories


        @smoke @manual
        Scenario: Software Catalog - Categories under Schema tab: A-09-TC09
            Given user is at cluster YAML tab
             When user clicks on View sidebar
              And user clicks on View Details under spec on the sidebar
              And user clicks on View Details under customization on the sidebar
              And user clicks on View Details under developerCatalog on the sidebar
              And user clicks on View Details under categories on the sidebar
             Then user will see categories which are shown in the software catalog


        @smoke @manual
        Scenario: Software Catalog Customization - Edit Categories: A-09-TC10
            Given user is at cluster YAML tab
              And user has removed all the categories from Software Catalog page
              And user has entered "[]" in front of spec.customization.developerCatalog.categories
             When user clicks on View sidebar
              And user clicks on Snippets on the sidebar
              And user removes "[]" in front of spec.customization.developerCatalog.categories
              And user clicks on Insert Snippet link on the sidebar
              And user removes Languages Category
              And user clicks on Save button
              And user clicks on Reload button
             Then user will see all the categories except Languages added under spec.customization.developerCatalog.categories
              And user will see all the categories except Languages on Software Catalog page


        @regression @manual
        Scenario: Devfiles on Software Catalog: A-09-TC011
             When user clicks on Devfiles type
             Then user will see the cards of Devfiles
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown
