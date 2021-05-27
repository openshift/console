@add-flow
Feature: Create workload from Operator Backed file
              As a user, I want to create the application, component or service from Developer Catalog Operator backed file

        Background:
            Given user has installed OpenShift Serverless Operator
              And user is at developer perspective
              And user is at Add page


# Below scenario needs to be executed only once. Second time it throws error. So not recommended to execute in automation suite
        @regression @manual
        Scenario: Create the workload from Operator Backed: A-08-TC01
            Given user has created or selected namespace "knative-eventing"
              And user is at OperatorBacked page
             When user selects knative Kafka card
              And user clicks Create button in side bar
              And user enters name as "knative-kafka" in Create knative Serving page
              And user clicks create button in Create knative Serving page
             Then user will be redirected to Topology page
              And user is able to see workload "knative-serving-1" in topology page


        @smoke @manual
        Scenario: Perform cancel operation: A-08-TC02
            Given user has created or selected namespace "knative-eventing"
              And user is at OperatorBacked page
             When user selects knative Serving card
              And user clicks Create button in side bar
              And user clicks cancel button in Create knative Serving page
             Then user will be redirected to Operator Backed page from knative Serving page
