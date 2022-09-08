@topology
Feature: Topology Display Filter Group
              As a user, I should be able to use the Display Filter Groups on Topology page

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-display-filter"
              And user is at Add page


        @regression
        Scenario: Topology display filter by expand option: T-18-TC01
            Given user has created workload "nodejs-ex-git" with resource type "Deployment"
              And user is at Topology page
              And user is at Topology Graph view
             When user clicks display options
              And user disbales expand option
             Then user will see the application_groupings checkbox will disable
              And user will see workload in text view


        @regression
        Scenario: Topology display filter by application grouping option: T-18-TC02
            Given user is at Topology page
              And user is at Topology Graph view
             When user clicks display options
              And user enables expand option
              And user unchecks the application grouping option
             Then user will see workload in text view


        @regression
        Scenario: Topology display filter by pod count option: T-18-TC03
            Given user is at Topology page
              And user is at Topology Graph view
             When user clicks display options
              And user checks the application grouping option
              And user checks the pod count option
             Then user will able to see the pod count inside workload


        @regression
        Scenario: Topology display filter by labels option: T-18-TC04
            Given user is at Topology page
              And user is at Topology Graph view
             When user clicks display options
              And user unchecks the labels option
             Then user will not able to see the labels on workload

        @regression
        Scenario: Topology display filter by expand option in list view: T-18-TC05
            Given user is at Topology page
              And user is at topology list view
             When user clicks display options
              And user disbales expand option
             Then user will see the application_groupings checkbox will disable
              And user will see deployment section is not visible
              And user will see deployments in count view