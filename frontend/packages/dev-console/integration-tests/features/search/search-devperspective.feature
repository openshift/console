@search-page @dev-console
Feature: Search page
              As a user, I need to see the last 5 resources that have been seen in the past so can quickly view their details without any further actions.



        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-search-enhancement"
              And user is at Search page


        @smoke
        Scenario: Recently Searched Section in Search Resource Page Dropdown: SR-01-TC01
             When user searches and selects for "AlertingRule"
              And user navigates to Topology page
              And user navigates to Search page
              And user clicks on Resources filter
             Then user can see "AlertingRule" in Recently used


        @regression
        Scenario: 5 Recently search items in Search Resource Page Dropdown: SR-01-TC02
             When user searches for "AlertingRule", "Deployment", "DeploymentConfig", "ConfigMap", and "BuildConfig"
              And user navigates to Topology page
              And user navigates to Search page
              And user clicks on Resources filter
             Then user can see "AlertingRule", "Deployment", "DeploymentConfig", "ConfigMap", and "BuildConfig" in Recently used


        @regression
        Scenario: Clear history for recently searched resource: SR-01-TC02
             When user searches and selects for "AlertingRule"
              And user navigates to Topology page
              And user navigates to Search page
              And user clicks on Resources filter
              And user clicks on clear history
             Then user can not see Recently used
