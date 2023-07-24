@customize-catalogs
Feature: Customization of catalogs and Add page through form view
              Allows cluster admins to selectively disable a sub-catalog and cards in Add page or disable the complete developer catalog and all cards in Add page through customisation form view

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-developer-catalog"


        @regression
        Scenario: When all the sub-catalogs are disabled: DC-01-TC01
            Given user is at console tab
             When user clicks on cluster
              And user opens customization
              And user clicks on Developer tab
              And user disables all the items in Developer Catalog
             Then user will see Save message
              And user will not see "Developer Catalog" and all the sub-catalogs in Add page and Topology page
              And user will not get any entry point to catalog page in add page, topology actions, empty states, quick search, and the catalog itself


        @regression
        Scenario: When specific sub-catalog is disabled: DC-01-TC02
            Given user is at customization
              And user clicks on Developer tab
              And user disables "Helm Charts" the item in Developer Catalog
             Then user will see Save message
              And user will see "Developer Catalog" and all the sub-catalogs in Add page and Topology page except "HelmChart"


        @regression
        Scenario: When specific sub-catalog is enabled: DC-01-TC03
            Given user is at customization
              And user clicks on Developer tab
              And user enabled "Helm Charts" and disables everything
             Then user will see Save message
              And user will only see "Developer Catalog" and "HelmChart" type in Add page and Topology page


        @regression
        Scenario: When all the Add page items are disabled: DC-01-TC04
            Given user is at customization
              And user clicks on Developer tab
              And user disables all the items in Add page
             Then user will see Save message
              And user will not see any cards in Add page except Getting Started


        @regression
        Scenario: When specific Add page item is disabled: DC-01-TC05
            Given user is at customization
              And user clicks on Developer tab
              And user disables "Import from Git" the item in Add page
             Then user will see Save message
              And user will not see any "Import from Git" card in Add page