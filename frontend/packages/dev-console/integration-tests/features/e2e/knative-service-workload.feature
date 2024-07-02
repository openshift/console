@e2e @smoke
Feature: OpenShift Serverless Operator E2E
              As a user, I should be able to perform end to end scenarios related to OpenShift Serverless Operator


        Background:
            Given user has created or selected namespace "aut-serverless-e2e"
              And user has installed OpenShift Serverless Operator
              And user is at developer perspective


        Scenario: Create knative workload from Import From Git card on Add page: EE-02-TC01
            Given user is at Add page
              And user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/logonoff/oc-node-func-with-env"
              And user enters Name as "node-knative"
              And user clicks "Show advanced Build option" link in Advanced Options section
              And user clicks "Show advanced Deployment option" link in Advanced Options section
             Then the environment variable "MY_BUILD_KEY" has value "tests" in the advanced options of the Build section in the Import from Git page
             Then the environment variable "MY_API_KEY" has value "{{ env:API_KEY }}" in the advanced options of the Deployment section in the Import from Git page
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "node-knative" in topology page list view


        @to-do
        Scenario: Actions on Knative Service: EE-02-TC02
            Given user is at the Topology page
             When user right clicks on the knative service "knative-demo"
              And user removes knative service "knative-demo" from Application Grouping
              And user sets Traffic Distribution
              And user edits Health Checks
              And user edits Labels
              And user edits Annotations
              And user edits Service
              And user deletes Service
             Then user will not see knative service "knative-demo"
