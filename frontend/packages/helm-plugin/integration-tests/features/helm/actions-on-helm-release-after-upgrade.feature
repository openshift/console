@helm @smoke
Feature: Verify the Actions on Helm Release after upgrade
              As a user, I want to perform the actions on the helm releases in topology page

        Background:
            Given user has created or selected namespace "aut-helm"


        @pre-condition
        Scenario: Perform Upgrade action on Helm Release through Context Menu: HR-01-TC04
            Given user has installed helm chart "Nodejs" with helm release name "nodejs-release-1"
              And user is at the Topology page
             When user right clicks on the helm release "nodejs-release-1" to open the context menu
              And user clicks on the "Upgrade" action
              And user clicks on the upgrade button
             Then user will be redirected to Topology page


        Scenario: Actions menu on Helm page after helm chart upgrade: HR-08-TC01
            Given user is on the Helm page with helm release "nodejs-release-1"
             When user clicks on the Kebab menu
             Then user is able to see kebab menu with actions Upgrade, Rollback and Uninstall Helm Release


        Scenario: Perform the helm chart upgrade for already upgraded helm chart : HR-08-TC02
            Given user is on the Helm page with helm release "nodejs-release-1"
             When user clicks on the Kebab menu
              And user clicks on the "Upgrade" action
              And user clicks on the upgrade button
             Then user will be redirected to Helm Releases page


        Scenario: Perform Rollback action on Helm Release through Context Menu: HR-08-TC03
            Given user is at the Topology page
              And user is on the topology sidebar of the helm release "nodejs-release-1"
             When user clicks on the Actions drop down menu
              And user clicks on the "Rollback" action
              And user selects the version to Rollback
              And user clicks on the rollback button
             Then user will be redirected to Topology page
