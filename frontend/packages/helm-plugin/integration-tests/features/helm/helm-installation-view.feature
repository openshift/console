@helm
Feature: Helm Chart Installation View
              As a user, I should be able switch between YAML and Form view to install Helm Chart


        Background:
            Given user has created or selected namespace "aut-helm"


        # This test is broken because now there is only on version of nodejs chart.
        @regression @broken-test
        Scenario: Grouping of Helm multiple chart versions together in developer catalog: HR-04-TC01
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user clicks on the chart versions dropdown menu
             Then user will see the information of all the chart versions

        @manual
        Scenario: Switch from YAML to Form view: HR-04-TC02
            Given user is at the Install Helm Chart page
             When user selects the YAML view
              And user does some changes in the yaml for helm chart
              And user selects the Form view
              And user comes back to YAML view
             Then user will see that the data hasn't lost

        # This test is broken because now there's no replica count field in the form.
        @smoke @broken-test
        Scenario: Data doesn't change while switching Form to YAML view: HR-04-TC03
            Given user is at Add page
             When user selects "Helm Chart" card from add page
              And user searches and selects "Nodejs" card from catalog page
              And user clicks on the Install Helm Chart button on side bar
              And user enters Release Name as "nodejs-release-3"
              And user enters Replica count as "3"
              And user selects the YAML view
              And user comes back to Form view
             Then user will see Release Name, Replica count as "nodejs-release-3", "3" respectively
