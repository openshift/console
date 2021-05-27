@e2e
Feature: OpenShift Serverless Operator E2E
              As a user, I should be able to perform end to end scenarios related to OpenShift Serverless Operator


        Background:
            Given user is at developer perspective
              And user installed OpenShift Serverless Operator
              And user has selected namespace "aut-serverless-e2e"


        @to-do
        Scenario: Create knative work load from Import From Git card on Add page: EE-02-TC01
            Given user is on "Import from Git" form page
             When user enters Git Repo url as "https://github.com/gajanan-more/knative-demo"
              And user enters name as "knative-demo"
              And user selects "Knative Service" as resource type
              And user clicks Create button
             Then user will be redirected to Topology page
              And user is able to see workload "knative-demo" in topology page list view


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
