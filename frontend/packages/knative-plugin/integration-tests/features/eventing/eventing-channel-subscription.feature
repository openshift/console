@knative-eventing
Feature: Knative Eventing Channel and Subscription
    User should be able to subscribe the Channel to the Knative Service and perform actions on it


        Background:
            Given user has created or selected namespace "aut-knative-camel-event-source"


        @smoke
        Scenario: Add Subscription to channel: KE-05-TC01
            Given user has created knative service "nodejs-ex-git"
              And user has created channel "channel-test"
              And user is at Topology page
             When user right clicks on the Channel "channel-test" to open the context menu
              And user selects "Add Subscription" from Context Menu
              And user enters Name as "channel-subscrip" on Add Subscription modal
              And user selects Subscriber "nodejs-ex-git" on Add Subscription modal
              And user clicks on Add button
             Then user will see connection between Channel "channel-test" and Subscriber "nodejs-ex-git"


        @regression @manual
        Scenario: Subscribe channel to multiple services: KE-05-TC02
            Given user is having Channel subscribed to a service on the Topology page
             When user right clicks on the Channel to open the context menu
              And user clicks on the Add Subscription
              And user updates name of subscription
              And user will click on the Subscriber dropdown on the modal
              And user selects the Subscriber
              And user clicks on Add button
             Then user will see connection between Channel and Subscriber
              And user will see a single channel subscribed to multiple services


        @regression @to-do
        Scenario: Delete Subscription: KE-05-TC03
            Given user is having Channel on the Topology page
              And user has already added the subscription
             When user right clicks on the Subscription to open the context menu
              And user clicks on the Delete Subscription
              And user clicks on the Delete button on the modal
             Then subscription will get deleted


        @regression @to-do
        Scenario: Move Subscription: KE-05-TC04
            Given user is having Channel on the Topology page
              And user has already added the subscription
             When user right clicks on the Subscription to open the context menu
              And user clicks on the Move Subscription
              And user selects the Subscriber from dropdown
              And user clicks on Save button
             Then user will see connection between Channel and Subscriber


        @regression @manual
        Scenario: Add Subscription using connector: KE-05-TC05
            Given user is having Channel on the Topology page
             When user drags the connector and drops it on graph
              And user clicks on Add Subscription
              And user enters name of subscription
              And user will click on the Subscriber dropdown on the modal
              And user selects the Subscriber
              And user clicks on Add button
             Then user will see connection between Channel and Subscriber


        @regression @to-do
        Scenario: Sidebar for the Event Source sinked Channel subscribed to Knative Service: KE-05-TC06
            Given user is having Channel subscribed to Knative Service on the Topology page
             When user clicks on the Subscription to open the sidebar
             Then user will see the Resources tab
              And user will see the Event Sources sinked to channel
              And user will see the Channel
              And user will see the Subscribers
              And user will see the Details tab
