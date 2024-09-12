@shipwright
Feature: Shipwright builds table view
              As a user, I want to create a Shipwright build using Create Shipwright build form

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-create-shipwright-build-form"
              And user has created shipwright builds
              And user is at Builds page

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
