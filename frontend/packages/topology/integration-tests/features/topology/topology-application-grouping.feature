@topology
Feature: Application groupings in topology
              As a user, I want to check application groupings

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-groupings-topoogy"


        @smoke
        Scenario: Verify Application grouping sidebar: T-05-TC01
            Given user is at Add page
              And user has created workload "nodejs-ex-git" with resource type "Deployment" and application groupings "nodejs-ex-git-app"
             When user clicks on application groupings "nodejs-ex-git-app"
             Then user can see sidebar opens with Resources tab selected by default for application groupings
              And user is able to see workload "nodejs-ex-git" under resources tab in the sidebar
              And user can see Actions dropdown menu


        @smoke
        Scenario: Verify Application grouping context menu: T-05-TC02
            Given user is at Topology page
             When user right clicks on Application "nodejs-ex-git-app" to open Context Menu
             Then user can view Add to Application and Delete Application options


        @regression
        Scenario: Add to Application in Application grouping from Action menu: T-05-TC03
            Given user is at Topology page
             When user clicks on application groupings "nodejs-ex-git-app"
              And user clicks on Action menu
              And user clicks "Add to Application" from action menu
              And user clicks on "From Git"
              And user fills the form with workload name "added-application-1" and clicks Create
             Then user can see "added-application-1" workload

        @regression
        Scenario: Delete Application grouping from Action menu: T-05-TC04
            Given user is at Add page
              And user has created workload "nodejs-1" with resource type "Deployment" and application groupings "app2"
             When user right clicks on Application "app2" to open Context Menu
              And user clicks on "Delete Application" from context action menu
              And user enters the name "app2" in the Delete Application modal and clicks on Delete button
             Then user will not see Application groupings "app2"
