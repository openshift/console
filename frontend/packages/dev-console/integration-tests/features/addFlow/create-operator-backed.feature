@add-flow
Feature: Create workload from Operator Backed file
              As a user, I want to create the application, component or service from Developer Catalog Operator backed file

        Background:
            Given user has installed OpenShift Serverless Operator
              And user is at developer perspective
              And user is at Add page


# Below scenario needs to be executed only once. Second time it throws error. So not recommended to execute in automation suite
        @regression @manual
        Scenario: Create the Knative Kafka workload from Operator Backed: A-08-TC01
            Given user has not created kafka instance in "knative-eventing" namespace
              And user has created or selected namespace "knative-eventing"
              And user is at OperatorBacked page
             When user selects knative Kafka card
              And user clicks Create button in side bar
              And user enters name as "knative-kafka" in Create KnativeKafka page
              And user clicks create button in Create KnativeKafka page
             Then user will be redirected to Topology page
              And user is able to see "knative-kafka" instance for serverless operator


        @smoke @manual
        Scenario: Perform cancel operation: A-08-TC02
            Given user has created or selected namespace "knative-eventing"
              And user is at OperatorBacked page
             When user selects knative Serving card
              And user clicks Create button in side bar
              And user clicks cancel button in Create knative Serving page
             Then user will be redirected to Operator Backed page from knative Serving page


        @regression @manual
        Scenario: Create the Jaeger workload from Operator Backed: A-08-TC03
            Given user has installed Jaeger operator
              And user has created or selected namespace "aut-jaeger"
              And user is at OperatorBacked page
             When user selects Jaeger card
              And user clicks Create button in side bar
              And user enters name as "jaeger-all-in-one-inmemory1" in Create Jaeger page
              And user clicks create button in Create Jaeger page
             Then user will be redirected to Topology page
              And user is able to see "jaeger-all-in-one-inmemory1" in Topology page
