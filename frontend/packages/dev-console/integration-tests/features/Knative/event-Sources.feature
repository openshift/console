Feature: Event Sources actions
    As a user, I should be able to visit the Event Sources page

    Background:
        Given user has installed OpenShift Serverless Operator
        And user has installed Knative Apache CamelK Operator
        And user has installed Knative Apache Kafka Operator
        And user is at developer perspective
        And user is at Add page
        And user has selected namespace "aut-create-knative-event-source"


    @manual
    Scenario: Filter the Event Sources
        Given user is at the Developer Catalog page
        When user clicks on Event Sources
        And user enters characters in the Filter field
        Then user will see only those event source cards that match the filters


    @manual
    Scenario: No Match Found
        Given user is at the Event Sources page
        When user enters something in the Filter field which doesn't match with any Event Source
        Then user will see the empty state with message "No Results Match the Filter Criteria"
        And user will see a button to clear all filters
