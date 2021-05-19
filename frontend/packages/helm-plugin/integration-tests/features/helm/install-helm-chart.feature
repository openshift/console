@helm
Feature: Install the Helm Release
              As a user, I want to install the helm release

        Background:
            Given user has created or selected namespace "aut-helm-chart"


        @smoke
        Scenario: The Helm Chart option on the +Add Page: HR-01-TC01
            Given user is at Add page
             Then user can see "Helm Chart" card on the Add page


        @smoke @manual
        Scenario: Developer Catalog Page when Helm Charts checkbox is selected: HR-01-TC02, HR-02-TC02
            Given user is at Add page
              And user has added multiple helm charts repositories
             When user selects "Helm Chart" card from add page
             Then user will get redirected to Helm Charts page
              And user will see the list of Chart Repositories
              And user will see the cards of Helm Charts
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown


        @regression
        Scenario: Install Helm Chart from Developer Catalog Page using YAML View: HR-03
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs Ex K v0.2.1" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user selects YAML view
              And user selects the Chart Version "0.2.1 / App Version 1.16.0 (Provided by Red Hat Helm Charts)"
             When user selects "Proceed" button from Change Chart version confirmation dialog
              And user clicks on the Install button
             Then user will be redirected to Topology page
              And Topology page have the helm chart workload "nodejs-ex-k"


        @smoke
        Scenario: Install Helm Chart from +Add Page using Form View: HR-02-TC01
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs v0.0.1" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user enters Release Name as "nodejs-example-1"
              And user clicks on the Install button
             Then user will be redirected to Topology page
              And Topology page have the helm chart workload "nodejs-example-1"


        @regression
        Scenario: Chart versions drop down menu
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Quarkus v0.0.3" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user clicks on the chart versions dropdown menu
             Then user will see the information of all the chart versions


        @regression @manual
        Scenario: Update the chart version to see the alert modal
            Given user is at the Install Helm Chart page
             When user does some changes on the yaml editor
              And user clicks on the Chart Versioon dropdown menu
              And user selects the different chart version
             Then modal will get popped up
              And modal will have the old and new chart versions
              And modal will have the warning of data lost


        @regression @manual
        Scenario: README should be updated when chart version is updated
            Given user is at Install Helm Chart page
             Then user will see the chart version dropdown
             When user selects YAML view
             When user selects the Chart Version "0.2.0 / App Version 1.16.0 (Provided by Red Hat Helm Charts)"
             When user selects "Proceed" button from Change Chart version confirmation dialog
             Then user will see that the README is also updated with new chart version "0.2.0 / App Version 1.16.0 (Provided by Red Hat Helm Charts)"
