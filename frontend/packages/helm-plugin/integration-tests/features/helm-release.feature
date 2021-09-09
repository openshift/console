@helm @smoke
Feature: Helm Release
              As a user, I want to perform actions on the helm release


        @pre-condition
        Scenario: Create or Select the project namespace
            Given user has created or selected namespace "aut-ci-helm"


        Scenario: Open the Helm tab on the navigation bar when helm charts are absent: HR-05-TC01
             When user clicks on the Helm tab
             Then user will be redirected to Helm releases page
              And user is able to see the message as no helm charts present
              And user will get the link to install helm charts from developer catalog


        Scenario: Install Helm Chart page details: HR-05-TC02
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
             Then Install Helm Chart page is displayed
              And release name displays as "nodejs"
              And form view radio button is selected by default
              And yaml view radio button is enabled
              And form sections are displayed in form view


        Scenario: Install Helm Chart from +Add Page using Form View: HR-06-TC04
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user enters Release Name as "nodejs-release"
              And user clicks on the Install button
             Then user will be redirected to Topology page
              And Topology page have the helm chart workload "nodejs-release"


        Scenario: Context menu options of helm release: HR-01-TC01
            Given user is at the Topology page
             When user right clicks on the helm release "nodejs-release" to open the context menu
             Then user is able to see the context menu with actions Upgrade and Uninstall Helm Release


        Scenario: Open the Helm tab on the navigation bar when helm charts are present: HR-05-TC05
            Given user is at the Helm page
             When user clicks on the Helm tab
             Then user will be redirected to Helm releases page
              And user will see the helm charts listed


        Scenario: Filter out deployed Helm Charts: HR-05-TC06
            Given user is at the Helm page
             When user clicks on the filter drop down
              And user selects checkbox for the "Deployed" Helm charts
             Then the checkbox for the "Deployed" Helm chart is checked
              And helm charts with status "Deployed" are listed


        Scenario: Helm release details page: HR-05-TC13
            Given user is at the Helm page
             When user clicks on the helm release name "nodejs-release"
             Then user will see the Details page opened
              And user will see the Resources tab
              And user will see the Revision History tab
              And user will see the Release Notes tab
              And user will see the Actions drop down menu with options Upgrade, Rollback, and Uninstall Helm Release


        Scenario: Actions menu on Helm page after helm chart upgrade: HR-08-TC01
            Given user is on the Helm page with helm release "nodejs-release"
             When user clicks on the Kebab menu
             Then user is able to see kebab menu with actions Upgrade, Rollback and Uninstall Helm Release


        Scenario: Perform Upgrade action on Helm Release through Context Menu: HR-01-TC04
            Given user is at the Topology page
             When user right clicks on the helm release "nodejs-release" to open the context menu
              And user clicks on the "Upgrade" action
              And user upgrades the chart Version
              And user clicks on the upgrade button
             Then user will be redirected to Topology page


        Scenario: Perform the helm chart upgrade for already upgraded helm chart : HR-08-TC02
            Given user is on the Helm page with helm release "nodejs-release"
             When user clicks on the Kebab menu
              And user clicks on the "Upgrade" action
              And user upgrades the chart Version
              And user clicks on the upgrade button
             Then user will be redirected to Helm Releases page


        Scenario: Perform Rollback action on Helm Release through Context Menu: HR-08-TC03
            Given user is at the Topology page
              And user is on the topology sidebar of the helm release "nodejs-release"
             When user clicks on the Actions drop down menu
              And user clicks on the "Rollback" action
              And user selects the version to Rollback
              And user clicks on the rollback button
             Then user will be redirected to Topology page


        Scenario: Uninstall Helm Release through Context Menu: HR-01-TC03
            Given user is at the Topology page
             When user right clicks on the helm release "nodejs-release" to open the context menu
              And user clicks on the "Uninstall Helm Release" action
              And user enters the release name "nodejs-release"
              And user clicks on the Uninstall button
             Then user will be redirected to Topology page
