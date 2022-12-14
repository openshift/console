@helm @smoke
Feature: Perform Actions on Helm Releases
              As a user, I want to perform the actions on the helm releases in topology page

        Background:
            Given user has created or selected namespace "aut-helm"


        @pre-condition
        Scenario: Install Helm Chart from +Add Page using Form View: HR-06-TC04
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs" card from catalog page
              And user clicks on the Create button on side bar
              And user enters Release Name as "nodejs-release-2"
              And user clicks on the Create button
             Then user will be redirected to Topology page
              And Topology page have the helm chart workload "nodejs-release-2"


        Scenario: Context menu options of helm release: HR-01-TC01
            Given user is at the Topology page
             When user right clicks on the helm release "nodejs-release-2" to open the context menu
             Then user is able to see the context menu with actions Upgrade and Delete Helm Release


        Scenario: Actions menu on Helm page: HR-01-TC02
            Given user is on the Helm page with helm release "nodejs-release-2"
             When user clicks on the Kebab menu
             Then user is able to see kebab menu with actions Upgrade, Rollback and Delete Helm Release


        Scenario: Delete Helm Release through Context Menu: HR-01-TC03
            Given user is at the Topology page
             When user right clicks on the helm release "nodejs-release-2" to open the context menu
              And user clicks on the "Delete Helm Release" action
              And user enters the release name "nodejs-release-2"
              And user clicks on the Delete button
             Then user will be redirected to Topology page
