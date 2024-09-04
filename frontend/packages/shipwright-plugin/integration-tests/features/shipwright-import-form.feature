@shipwright @odc-7634
Feature: Create Application from git form using Shipwright as build option
              As a user, I want to create the application, component or service from Add options using Shipwright as build option

        Background:
            Given user is at developer perspective
              And user has installed the Builds for Openshift Operator
              And user has created or selected namespace "aut-shipwright-build-import-form"
              And user is at Add page

        @smoke
        Scenario Outline: Add new git workload with Shipwright as build option
            Given user is at Import from Git form
             When user enters Git Repo URL as "<git_repo_url>"
              And user enters Application name as "shipwright-builds"
              And user enters Name as "<name>"
              And user selects Build option as "Builds for Openshift" in Build section
              And user selects "<cluster_build_strategy>" as Cluster Build Strategy
              And user selects resource type as "Deployment"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user can see toast notification saying "Deployment" created successfully
              And user is able to see workload "<name>" in topology page

        Examples:
                  | git_repo_url                                   | name               | cluster_build_strategy |
                  | https://github.com/digitalocean/sample-nodejs  | sample-nodejs-sw   | S2I                    |
                  | https://github.com/Lucifergene/knative-do-demo | knative-do-demo-sw | Buildah                |
