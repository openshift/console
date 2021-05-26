@helm
Feature: Navigations on Helm Chart
              As a user, I want to navigate to different pages related to Helm Charts

        Background:
            Given user has created or selected namespace "aut-helm-navigation"


        @smoke
        Scenario: Open the Helm tab on the navigation bar when helm charts are absent: HR-05-TC01
             When user clicks on the Helm tab
             Then user will be redirected to Helm releases page
              And user is able to see the message as no helm charts present
              And user will get the link to install helm charts from developer catalog


        @smoke
        Scenario: Install Helm Chart page: HR-05-TC02
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs Ex K v0.2.1" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
             Then Install Helm Chart page is displayed
              And release name displays as "nodejs-ex-k"


        @smoke
        Scenario: Yaml view editor for Install Helm Chart page: HR-05-TC03
            Given user is at Install Helm Chart page
             When user selects YAML view
             Then user is able to see YAML editor


        @smoke
        Scenario: Install Helm Chart: HR-05-TC04
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs Ex K v0.2.1" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user clicks on the Install button
             Then user will be redirected to Topology page
              And Topology page have the helm chart workload "nodejs-example"


        @smoke
        Scenario: Open the Helm tab on the navigation bar when helm charts are present: HR-05-TC05
            Given user has installed helm chart
              And user is at the Helm page
             When user clicks on the Helm tab
             Then user will be redirected to Helm releases page
              And user will see the helm charts listed


        @regression
        Scenario: Filter out deployed Helm Charts: HR-05-TC06
            Given user is at the Helm page
             When user clicks on the filter drop down
              And user selects checkbox for the "Deployed" Helm charts
             Then the checkbox for the "Deployed" Helm chart is checked
              And helm charts with status "Deployed" are listed


        Scenario: Filter out failed Helm Charts: HR-05-TC07
            Given user is at the Helm page
             When user clicks on the filter drop down
              And user selects checkbox for the "Failed" Helm charts
             Then the checkbox for the "Failed" Helm chart is checked
              And helm charts with status "Failed" are listed


        Scenario: Filter out other Helm charts: HR-05-TC08
            Given user is at the Helm page
             When user clicks on the filter drop down
              And user selects checkbox for the "Other" Helm charts
             Then the checkbox for the "Other" Helm chart is checked
              And helm charts with status "Other" are listed


        @regression
        Scenario: Select all filters: HR-05-TC09
            Given user is at the Helm page
             When user clicks on the filter drop down
              And user selects checkbox for the "All" Helm charts
             Then the checkbox for the "All" Helm chart is checked


        @regression
        Scenario: Clear all filters: HR-05-TC10
            Given user is at the Helm page
             When user clicks on the filter drop down
              And user selects checkbox for the "All" Helm charts
              And user clicks on the clear all filters button
             Then "All" filters selected will get removed


        @regression
        Scenario: Search for the Helm Chart: HR-05-TC11
            Given user is at the Helm page
             When user searches for a helm chart "nodejs-ex-k"
             Then the helm chart "nodejs-ex-k" will be shown


        @smoke
        Scenario: Search for the not available Helm Chart: HR-05-TC12
            Given user is at the Helm page
             When user searches for a helm chart "Nodejs Ex K v0.10.0"
             Then user is able to see message on the Helm page as "Not found"


        @smoke
        Scenario: Helm release details page: HR-05-TC13
            Given user is at the Helm page
             When user clicks on the helm release name "nodejs-ex-k"
             Then user will see the Details page opened
              And user will see the Resources tab
              And user will see the Revision History tab
              And user will see the Release Notes tab
              And user will see the Actions drop down menu with options Upgrade, Rollback, and Uninstall Helm Release
