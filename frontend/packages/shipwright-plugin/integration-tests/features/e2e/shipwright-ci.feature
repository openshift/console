@shipwright
Feature: Shipwright build details page
              As a user, I want check my Shipwright Build and see all related BuildRuns in a second tab.

        Background:
            Given user has installed OpenShift Pipelines Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-shipwright-build-details"
              And user has installed Shipwright Operator
              And user is at Add page
              And user has created shipwright builds


        @smoke
        Scenario: Shipwright build page in dev perspective: SWB-01-TC01
             When user navigates to Builds in Developer perspective
              And user clicks on "Shipwright Builds" tab
             Then user will see Shipwright Builds
              And user will see "Succeeded", "Failed" and "Unknown" in Filter list


        @smoke
        Scenario: Shipwright build page in admin perspective: SWB-01-TC02
             When user switches to Administrative perspective
              And user clicks on Builds navigation in Administrative perspective
             Then user will see "Shipwright Builds" tab
             Then user will see "Shipwright BuildRuns" tab


        @regression
        Scenario: Shipwright build details page: SWB-01-TC03
            Given user is on Builds navigation in Developer perspective
             When user clicks on "Shipwright Builds" tab
              And user clicks on "buildpack-nodejs-build-heroku" build
             Then user will see "Strategy", "Source URL" and "Output image"
              And user will see "Status" section


        @regression
        Scenario: Event tab in build details page: SWB-01-TC04
            Given user is at Shipwright Builds details page for build "buildpack-nodejs-build-heroku"
             When user clicks on Event tab
             Then user will see events steaming


        @regression
        Scenario: Filter in Shipwright build runs page: SWB-01-TC05
            Given user is at Shipwright Builds details page for build "buildpack-nodejs-build-heroku"
             When user clicks on "BuildRuns" tab
              And user clicks on Filter
             Then user will see "Pending", "Running", "Succeeded", "Failed" and "Unknown" options


        @regression
        Scenario: Shipwright build runs details page: SWB-01-TC06
            Given user is at Shipwright Builds details page for build "buildpack-nodejs-build-heroku"
             When user clicks on "BuildRuns" tab
              And user clicks on build run "buildpack-nodejs-build-heroku-1"
             Then user will see "BuildRun details" section
              And user will see "Conditions" section
              And user will see "Status", "Build" and "BuildSpec details" section in BuildRun details


        @regression
        Scenario: Event tab in build details page: SWB-01-TC07
            Given user is at Shipwright Builds details page for build "buildpack-nodejs-build-heroku"
             When user clicks on "BuildRuns" tab
              And user clicks on build run "buildpack-nodejs-build-heroku-1"
              And user clicks on Event tab
             Then user will see events steaming


        @regression
        Scenario: Checking error for failed build runs : SWB-01-TC08
            Given user is at Shipwright Builds run page "buildpack-nodejs-build-heroku"
              And user has a failed build run
             When user clicks on Failed Status
             Then user will see pop up with error message
