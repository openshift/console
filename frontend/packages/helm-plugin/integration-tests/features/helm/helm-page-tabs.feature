@helm @ODC6715
Feature: Add repositories tab in Helm navigation item
        As a user, I want to navigate to different tabs related to Helm in the Helm page

        Background:
            Given user has created or selected namespace "aut-helm"
            

        @regression
        Scenario: Helm Page on developer perspective: HR-09-TC01
            Given user is at developer perspective
             When user clicks on the Helm tab
             Then user is able to see Helm Releases and Repositories Tabs
              And user is able to see the message "No Helm Releases found"
              And user is able to see the link "Install a Helm Chart from the developer catalog"
              And user is able to see the Create drop down menu with Helm Release and Repository options
        
        
        @regression
        Scenario: Repositories Tab on Helm Page: HR-09-TC02
            Given user is at the Helm page
             When user clicks on Repositories tab
              And user clicks on "openshift-helm-charts" repository
             Then Repositories breadcrumbs is visible
              And user clicks on Repositories link
              And user is redirected to Repositories tab


        @regression
        Scenario: Click on Create Helm Release: HR-09-TC03
            Given user is at the Helm page
             When user clicks on Helm release in create action menu
              And user searches and selects "Nodejs" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user enters Release Name as "nodejs-release-2"
              And user clicks on the Install button
             Then user will be redirected to Topology page
              And Topology page have the helm chart workload "nodejs-release-2"



