@customize-catalogs
Feature: Customization of catalogs
                Allows cluster admins to selectively disable a sub-catalog and all links to the specific sub-catalog or disable the complete developer catalog

        Background:
            Given user has created or selected namespace "aut-developer-catalog"

 @regression @manual
        Scenario: When all the sub-catalogs are disabled: DC-01-TC01
            Given user is at cluster YAML of "operator.openshift.io/v1" console
             When user adds the "Add sub-catalog types" code snippet under spec.customization.developerCatalog.types
              And user changes the state to "Disabled" and removes enabled attribute
              And user clicks on Save button
             Then user will not see "Developer Catalog" and all the sub-catalogs in Add page and Topology page
              And user will not get any entry point to catalog page in add page, topology actions, empty states, quick search, and the catalog itself

  @regression @manual
        Scenario: When all the sub-catalogs are enabled: DC-01-TC02
            Given user is at cluster YAML of "operator.openshift.io/v1" console
             When user adds the "Add sub-catalog types" code snippet under spec.customization.developerCatalog.types
              And user keeps the state as "Enabled" and removes enabled attribute
              And user clicks on Save button
             Then user will see "Developer Catalog" and all the sub-catalogs in Add page and Topology page

  @regression @manual
        Scenario: When specific sub-catalog is disabled: DC-01-TC03
            Given user is at cluster YAML of "operator.openshift.io/v1" console
             When user adds the "Add sub-catalog types" code snippet under spec.customization.developerCatalog.types
              And user changes the state to "Disabled" and removes enabled attribute and adds "disabled: ['HelmChart']"
              And user clicks on Save button
             Then user will see "Developer Catalog" and all the sub-catalogs in Add page and Topology page except "HelmChart"


  @regression @manual
        Scenario: When specific sub-catalog is enabled: DC-01-TC04
            Given user is at cluster YAML of "operator.openshift.io/v1" console
             When user adds the "Add sub-catalog types" code snippet under spec.customization.developerCatalog.types
              And user keeps the state as "Enabled" and keeps "HelmChart" in enabled and removes everything
              And user clicks on Save button
             Then user will only see "Developer Catalog" and "HelmChart" type in Add page and Topology page