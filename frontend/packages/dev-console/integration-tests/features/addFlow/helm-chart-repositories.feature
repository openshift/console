@add-flow @odc-6452
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
        Scenario: Form-yaml switcher in ProjectHelmChartRepository create form: A-12-TC02
            Given user is at Add page
             When user selects Helm Chart repositories card from Add page
              And user switches to YAML
             Then user can see YAML view


        @regression
        Scenario: Configure custom Helm Chart repository.: A-12-TC03
            Given user is at Add page
             When user selects Helm Chart card on the Add page
              And user clicks "try to configure their own custom Helm Chart repository" link in Helm Charts catalog description
             Then user can see "Create ProjectHelmChartRepository" form


        @regression
        Scenario: Add namespaced helm chart repository using a form: A-12-TC04
            Given user is at Create ProjectHelmChartRepository page
             When user enters Chart repository name as "helm-test1"
              And user enters Description as "test"
              And user enters URL as "https://raw.githubusercontent.com/IBM/charts/master/repo/community/index.yaml"
              And user clicks on Create button
             Then user can see "helm-test1" under Chart Repositories in Helm Charts catalog page
