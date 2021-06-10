@project-access
Feature: Project Access page
              As a administrator, I want to customize the roles which are being shown in the Project Access tab in the Developer console, this includes removing default roles as well as adding custom roles.


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-project-access"


        @regression @manual
        Scenario: Adding Custom role in project membership: PA-01-TC01
            Given user has cluster role basic-user created
             When user clicks on Search tab in navigation menu
              And user searches console in Resources dropdown
              And user selects Console with apiVersion operator.openshift.io/v1 option from Resources dropdown
              And user clicks on "cluster" Name in Consoles
              And user switches to YAML tab
              And user adds spec.customization.projectAccess section
              And user inserts Add project access roles Snippet from the Sidebar under spec.customization.projectAccess section
              And user adds "- basic-user" under the other three role added from Snippet
              And user clicks on Save button
              And user clicks on Project tab in navigation menu
              And user clicks Project access tab
              And user clicks on Role dropdown for kube:admin Name
             Then user will see "basic-user" option in the dropdown



        @regression @manual
        Scenario: Removing Custom role in project membership: PA-01-TC02
            Given user has added custom role "basic-user" in console YAML
              And user is at cluster YAML of "operator.openshift.io/v1" console
             When user removes "- view" from spec.customization.projectAccess.availableClusterRoles
              And user clicks on Save button
              And user clicks on Project tab in navigation menu
              And user clicks Project access tab
              And user clicks on Role dropdown for kube:admin Name
             Then user will not see "view" option in the dropdown
