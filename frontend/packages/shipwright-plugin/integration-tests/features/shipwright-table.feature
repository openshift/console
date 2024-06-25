@shipwright
Feature: Shipwright builds table view
              As a user, I want check my Shipwright Build and see latest BuildRun of each in a relevant table.

        Background:
            Given user has installed OpenShift Pipelines Operator
              And user has installed Shipwright Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-shipwright-build-details"
              And user has created shipwright builds
              And user is at Builds page

        @smoke
        Scenario: Shipwright Builds Table should contain all the required headers: SWB-03-TC01
            Given user is at Builds page
             When user clicks on "Shipwright Builds" tab
             Then user will see "Name"
              And user will see "Output"
              And user will see "Last run"
              And user will see "Last run status"
              And user will see "Last run time"
              And user will see "Last run duration"


        @smoke
        Scenario: Upon clicking name of a Build, it should go to appropriate Build details page: SWB-03-TC02
            Given user is at Builds page
             When user clicks on "Shipwright Builds" tab
              And user clicks on "buildpack-nodejs-build-heroku" build
             Then user will see "buildpack-nodejs-build-heroku" Build details page


        @smoke
        Scenario: Upon clicking name of a BuildRun, it should go to appropriate BuildRun details page: SWB-03-TC03
            Given user is at Builds page
             When user clicks on "Shipwright Builds" tab
              And user clicks on last run of "buildpack-nodejs-build-heroku" build
             Then user will see "buildpack-nodejs-build-heroku" BuildRun details page
