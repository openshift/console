Feature: Event Sources actions
    As a user, I should be able to visit the Event Sources page

    Background:
        Given user has installed OpenShift Serverless Operator
        And user has installed Knative Apache CamelK Operator
        And user has installed Knative Apache Kafka Operator
        And user is at developer perspecitve
        And user is at Add page
        And user has selected namespace "aut-create-knative-event-source"


    @manual
    Scenario: Scroll bar on the Event Sources cards page
        Given user is at the Event Sources page
        And user has added more than 10 Event Sources
        Then user will see the Scroll bar added to see all the card


    @manual
    Scenario: Filter the Event Sources
        Given user is at the Event Sources page
        When user enters characters in the Filter field
        Then user will see only those event source cards that match the filters


    @manual
    Scenario: No Match Found
        Given user is at the Event Sources page
        When user enters something in the Filter field which doesn't match with any Event Source
        Then user will see the empty state with message "No Results Match the Filter Criteria"
        And user will see a button to clear all filters


    @manual
    Scenario: Selected card will be shown even though filters doesn't match
        Given user is at the Event Sources page
        When user selects a card
        And user enters characters in the Filter field that doesn't match with selected card
        Then user will see that selected card even though filters doesn't match
