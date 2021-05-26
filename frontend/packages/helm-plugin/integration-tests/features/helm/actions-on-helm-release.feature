@helm @smoke
Feature: Perform Actions on Helm Releases
              As a user, I want to perform the actions on the helm releases in topology page

        Background:
            Given user has created or selected namespace "aut-helm-actions"


        Scenario: Context menu options of helm release: HR-01-TC01
            Given user has installed helm release "nodejs-ex-k"
              And user is at the Topology page
             When user right clicks on the helm release "nodejs-ex-k" to open the context menu
             Then user is able to see the context menu with actions Upgrade, Rollback and Uninstall Helm Release


        Scenario: Actions drop down on the side bar: HR-01-TC02
            Given user is at the Topology page
              And user is on the topology sidebar of the helm release "nodejs-ex-k"
             When user clicks on the Actions drop down menu
             Then user is able to see the actions dropdown menu with actions Upgrade, Rollback and Uninstall Helm Release


        Scenario: Actions menu on Helm page: HR-01-TC03
            Given user is on the Helm page with helm release "nodejs-ex-k"
             When user clicks on the Kebab menu
             Then user is able to see kebab menu with actions Upgrade, Rollback and Uninstall Helm Release


        Scenario: Perform Upgrade action on Helm Release through Context Menu: HR-01-TC04
            Given user is at the Topology page
             When user right clicks on the helm release "nodejs-ex-k" to open the context menu
              And user clicks on the "Upgrade" action
              And user upgrades the chart Version
              And user clicks on the upgrade button
             Then user will be redirected to Topology page


        Scenario: Perform Rollback action on Helm Release through Context Menu: HR-01-TC05
            Given user is at the Topology page
             When user right clicks on the helm release "nodejs-ex-k" to open the context menu
              And user clicks on the "Rollback" action
              And user selects the version to Rollback
              And user clicks on the rollback button
             Then user will be redirected to Topology page


        Scenario: Uninstall Helm Release through Context Menu: HR-01-TC06
            Given user is at the Topology page
             When user right clicks on the helm release "nodejs-ex-k" to open the context menu
              And user clicks on the "Uninstall Helm Release" action
              And user enters the release name
              And user clicks on the Uninstall button
             Then user will be redirected to Topology page with no workloads
