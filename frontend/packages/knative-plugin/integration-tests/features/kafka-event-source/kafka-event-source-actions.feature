@knative-camelK
Feature: Kafka event Sources actions
              As a user, I should be able to visit the Event Sources page

        Background:
            Given user has installed Knative Apache Camelk Integration Operator
              And user has installed Serverless Operator
              And user has created Knative Kafka instance in knative-eventing namespace
              And user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-create-knative-event-source"


        @regression @manual
        Scenario: Filter the Event Sources: KF-03-TC01
            Given user is at the Developer Catalog page
             When user clicks on Event Sources
              And user enters characters in the Filter field
             Then user will see only those event source cards that match the filters


        @regression @manual
        Scenario: No Match Found: KF-03-TC02
            Given user is at the Event Sources page
             When user enters something in the Filter field which doesn't match with any Event Source
             Then user will see the empty state with message "No Results Match the Filter Criteria"
              And user will see a button to clear all filters
