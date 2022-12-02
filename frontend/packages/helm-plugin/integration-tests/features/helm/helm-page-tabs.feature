@helm @odc-6685
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
              And user is able to see the link "Browse the catalog to discover and install Helm Charts"
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
              And user clicks on the Create button on side bar
              And user enters Release Name as "nodejs-release-2"
              And user clicks on the Create button
             Then user will be redirected to Topology page
              And Topology page have the helm chart workload "nodejs-release-2"


        @regression
        Scenario: Create Project Helm Chart Repository: HR-09-TC04
            Given user is at the Helm page
             When user clicks on Repository in create action menu to see the "Create Helm Chart Repository" form
               And user enters Chart repository name as "helm-test1"
               And user enters Description as "test"
               And user enters URL as "https://raw.githubusercontent.com/IBM/charts/master/repo/community/index.yaml"
               And user clicks on Create button
             Then user can see "ProjectHelmChartRepository" "helm-test1" details page


        @regression
        Scenario: Edit Project Helm Chart Repository: HR-09-TC05
            Given user is at the Helm page
             When user clicks on Repositories tab
               And user edits "helm-test1" "ProjectHelmChartRepository"
               And user enters Display name as "My charts"
               And user clicks on Save button to see the "ProjectHelmChartRepository" "helm-test1" details page
               And user navigates to Helm page
               And user clicks on Repositories tab
             Then user can see "ProjectHelmChartRepository" "helm-test1" updated with "My charts" in the list page

        @regression
        Scenario: Create Helm Chart Repository: HR-09-TC06
            Given user is at the Helm page
             When user clicks on Repository in create action menu to see the "Create Helm Chart Repository" form
               And user selects cluster-scoped scope type
               And user enters Chart repository name as "helm-test2"
               And user enters URL as "https://raw.githubusercontent.com/Azure-Samples/helm-charts/master"
               And user clicks on Create button
             Then user can see "HelmChartRepository" "helm-test2" details page

        
        @regression
        Scenario: Edit Helm Chart Repository: HR-09-TC07
            Given user is at the Helm page
             When user clicks on Repositories tab
               And user edits "helm-test2" "HelmChartRepository"
               And user enters URL as "https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docs/index.yaml"
               And user clicks on Save button to see the "HelmChartRepository" "helm-test2" details page
               And user navigates to Helm page
               And user clicks on Repositories tab
             Then user can see "HelmChartRepository" "helm-test2" updated with "https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docs/index.yaml" in the list page


