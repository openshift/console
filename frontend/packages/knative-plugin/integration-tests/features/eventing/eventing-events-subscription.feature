@knative-eventing @knative
Feature: Knative Events Subscription
    User should be able to create Triggers for Knative Events using the Subscribe Form

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "knative-events-aut"


        @pre-condition
        Scenario: Create Broker and Knative Service and send event to Broker: KE-07-TC01
            Given user has updated the knative-eventing CM to enable the eventtype auto create
              And user creates "KnativeService" via the CLI in the namespace "knative-events-aut"
              And user creates "Broker" via the CLI in the namespace "knative-events-aut"
              And user sends an event to the Broker in the namespace "knative-events-aut"


        @smoke @odc-7665
        Scenario: Add Trigger to Event Subscription: KE-07-TC02
            Given user is at Add page
             When user clicks on Events card
              And user clicks on "com.corp.integration.warning (knative-events-aut/my-broker)" card in Events page
              And user clicks on Subscribe on the sidebar
              And user sees the Subscribe form
              And user enters name as "events-test10" in the Subscribe Form
              And user clicks on the Subscriber dropdown and selects "showcase"
              And user clicks on Add more to add new pair "hello":"world"
              And user clicks the Subscribe button
             Then user will see connection between Broker and Subscriber
              And user will see sidebar in topology page with title "events-test10" on clicking the connection





