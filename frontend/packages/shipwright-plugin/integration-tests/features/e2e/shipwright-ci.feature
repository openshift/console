@shipwright
Feature: Shipwright build details page
              As a user, I want check my Shipwright Build and see all related BuildRuns in a second tab.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-shipwright-build-details"
              And user has created shipwright builds

        @smoke
        Scenario: Shipwright tab should be default on first open if the operator is installed (ODC-7623): SWB-01-TC01
             When user navigates to Builds in Developer perspective
             Then user will see Shipwright Builds
              And user will see "Succeeded", "Failed" and "Unknown" in Filter list

        @smoke
        Scenario: Shipwright Builds Table should contain all the required headers: SWB-03-TC01
            Given user is at Builds page
             When user clicks on "Shipwright Builds" tab in the Developer perspective
             Then user will see "Name"
              And user will see "Output"
              And user will see "Last run"
              And user will see "Last run status"
              And user will see "Last run time"
              And user will see "Last run duration"


                  
        @smoke
        Scenario Outline: Create a Build using Create Shipwright build form: SWB-04-TC01
            Given user is at Builds page
             When user select create Build option
              And user is at Create Shipwright build page
              And user enters Name as "<name>"
              And user enters Git Repo URL as "<git_repo_url>"
              And user select Build Strategy option "<build_strategy>"
              And user enters builder-image param as "<builder_image>"
              And user enters Output image as "<output_image>"
              And user clicks Create button
             Then user will be redirected to "<name>" build details page
              And user will see Strategy "<build_strategy>"
              And user will see Source URL "<git_repo_url>"
              And user will see Builder image "<builder_image>"

        Examples:
                  | git_repo_url                                             | name            | build_strategy  | builder_image                                                             | output_image                                                                           |
                  | https://github.com/nodeshift-blog-examples/react-web-app | s2i-cbs-example | source-to-image | image-registry.openshift-image-registry.svc:5000/openshift/nodejs:20-ubi8 | image-registry.openshift-image-registry.svc:5000/build-examples/s2i-cbs-example:latest |

        @smoke
        Scenario: Shipwright page in admin perspective: SWB-01-TC02
             When user switches to Administrative perspective
              And user clicks on Builds navigation in Administrative perspective
              And user clicks on "Shipwright" tab in the Administrator perspective
             Then user will see "Builds" horizontal link tab
              And user will see "BuildRuns" horizontal link tab
              And user will see "BuildStrategies" horizontal link tab
              And user will see "ClusterBuildStrategies" horizontal link tab

        # Disabling the test due to the BUG : https://issues.redhat.com/browse/OCPBUGS-41945
        @regression @broken-test
        Scenario: Shipwright build details page: SWB-01-TC03
            Given user is on Builds navigation in Developer perspective
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
             When user clicks on "BuildRuns" tab in the Developer perspective
              And user clicks on Filter
             Then user will see "Pending", "Running", "Succeeded", "Failed" and "Unknown" options

        # Disabling the test due to the BUG : https://issues.redhat.com/browse/OCPBUGS-41944
        @regression @broken-test
        Scenario: Shipwright build runs details page: SWB-01-TC06
            Given user is at Shipwright Builds details page for build "buildpack-nodejs-build-heroku"
             When user clicks on "BuildRuns" tab in the Developer perspective
              And user clicks on build run "buildpack-nodejs-build-heroku-1"
             Then user will see "BuildRun details" section
              And user will see "Conditions" section
              And user will see "Status", "Build" and "BuildSpec details" section in BuildRun details


        @regression
        Scenario: Event tab in build details page: SWB-01-TC07
            Given user is at Shipwright Builds details page for build "buildpack-nodejs-build-heroku"
             When user clicks on "BuildRuns" tab in the Developer perspective
              And user clicks on build run "buildpack-nodejs-build-heroku-1"
              And user clicks on Event tab
             Then user will see events steaming

        # Disabling the test due to the BUG : https://issues.redhat.com/browse/OCPBUGS-41945
        @regression @broken-test
        Scenario: Checking error for failed build runs : SWB-01-TC08
            Given user is at Shipwright Builds run page "buildpack-nodejs-build-heroku"
              And user has a failed build run
             When user clicks on Failed Status
             Then user will see pop up with error message


