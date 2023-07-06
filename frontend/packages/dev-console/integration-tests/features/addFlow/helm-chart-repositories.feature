@add-flow @dev-console @odc-6452
Feature: Install the Helm Release
              As a user, I want to install project helm repository


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-add-helm"



        @smoke @manual
        Scenario: Helm Chart repositories card on the Add Page: A-12-TC01
            Given user is at Add page
             Then user can see Helm Chart repositories card on the Add page


        @regression
        Scenario: Form-yaml switcher in Helm Chart Repository create form: A-12-TC02
            Given user is at Add page
             When user selects Helm Chart repositories card from Add page
              And user switches to YAML
             Then user can see YAML view


        @regression
        Scenario: Configure custom Helm Chart repository.: A-12-TC03
            Given user is at Add page
             When user selects Helm Chart card on the Add page
              And user clicks "try to configure their own custom Helm Chart repository" link in Helm Charts catalog description
             Then user can see "Create Helm Chart Repository" form


        @regression
        Scenario: Add namespaced helm chart repository using a form: A-12-TC04
            Given user is at Create Helm Chart Repository page
             When user enters Chart repository name as "helm-test1"
              And user enters Description as "test"
              And user enters URL as "https://raw.githubusercontent.com/IBM/charts/master/repo/community/index.yaml"
              And user clicks on Create button
             Then user can see "helm-test1" for resource "helm-test1" and type "projecthelmchartrepository" under Chart Repositories in Helm Charts catalog page

        @regression  @odc-6685
        Scenario: Add namespaced helm chart repository with a display name: A-12-TC05
            Given user is at Create Helm Chart Repository page
             When user enters Chart repository name as "helm-test1"
              And user enters Display name as "My Helm Charts"
              And user enters Description as "test"
              And user enters URL as "https://raw.githubusercontent.com/IBM/charts/master/repo/community/index.yaml"
              And user clicks on Create button
             Then user can see "My Helm Charts" for resource "helm-test1" and type "projecthelmchartrepository" under Chart Repositories in Helm Charts catalog page

        @regression
        Scenario: Add cluster-scoped helm chart repository using a form: A-12-TC06
            Given user is at Create Helm Chart Repository page
             When user selects cluster-scoped scope type
              And user enters Chart repository name as "helm-test2"
              And user enters Description as "test"
              And user enters URL as "https://raw.githubusercontent.com/Azure-Samples/helm-charts/master/docs/index.yaml"
              And user clicks on Create button
             Then user can see "helm-test2" for resource "helm-test2" and type "helmchartrepository" under Chart Repositories in Helm Charts catalog page
