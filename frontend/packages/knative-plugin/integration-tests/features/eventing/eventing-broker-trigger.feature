@knative-eventing @knative
Feature: Knative Eventing Broker and Trigger
    User should be able to trigger the Broker to the Knative Service and perform actions on it


        Background:
            Given user has created or selected namespace "aut-broker-trigger"


        @regression @odc-6359
        Scenario: Multiple Subscriber in Add triger modal: KE-04-TC01
            Given user has created knative service "nodejs-ex-git"
              And user created Broker "broker-test1"
              And user is at Topology page
             When user right clicks on the Broker "broker-test1" to open the context menu
              And user clicks on the Add Trigger
              And user will click on the Subscriber dropdown on the modal
             Then Subscriber has knative service dropdown with "Service" and "KSVC" options


        @smoke
        Scenario: Add Trigger to Broker: KE-04-TC02
            Given user is having Broker "broker-test1" on the Topology page
              And user is having knative service "nodejs-ex-git"
              And user is at Topology page
             When user right clicks on the Broker "broker-test1" to open the context menu
              And user clicks on the Add Trigger
              And user selects the auto populated name of subscription
              And user will click on the Subscriber dropdown on the modal
              And user selects the Subscriber "nodejs-ex-git"
              And user clicks on Add button
             Then user will see connection between Broker and Subscriber


        @regression @manual
        Scenario: Visual multiple trigger to Broker with multiple services: KE-04-TC03
            Given user is having Broker subscribed to a service on the Topology page
             When user right clicks on the Broker to open the context menu
              And user clicks on the Add Trigger
              And user updates name of Trigger
              And user will click on the Subscriber dropdown on the modal
              And user selects the Subscriber
              And user clicks on Add button
             Then user will see connection between Broker and Subscriber
              And user will see a single Broker subscribed to multiple services


        @regression
        Scenario: Move Trigger: KE-04-TC04
            Given user is having Broker "broker-test1" on the Topology page
              And user has created knative service "nodejs-ex-git2"
              And user has already added the trigger
             When user right clicks on the Trigger to open the context menu
              And user clicks on the Move Trigger
              And user selects the Subscriber "nodejs-ex-git2" from dropdown
              And user clicks on Save button
             Then user will see connection between Broker and Subscriber


        @regression
        Scenario: Delete Trigger: KE-04-TC05
            Given user is having Broker "broker-test1" on the Topology page
              And user has already added the trigger
             When user right clicks on the Trigger to open the context menu
              And user clicks on the Delete Trigger
              And user clicks on the Delete button on the modal
             Then trigger will get deleted


        @regression @manual
        Scenario: Add Trigger using connector: KE-04-TC06
            Given user is having Broker on the Topology page
             When user drags the connector and drops it on graph
              And user clicks on Add Trigger
              And user enters name of trigger
              And user will click on the Subscriber dropdown on the modal
              And user selects the Subscriber
              And user clicks on Add button
             Then user will see connection between Broker and Subscriber


    @regression @broken-test
    # Bug 2090193 : https://bugzilla.redhat.com/show_bug.cgi?id=2090193
        Scenario: Sidebar for the Event Source sinked Broker subscribed to Knative Service: KE-04-TC07
            Given user is having Broker "broker-test1" subscribed to Knative Service on the Topology page
              And user has already added the trigger
             When user clicks on the Subscription "nodejs-ex-git2" to open the sidebar
             Then user will see the Resources tab
              And user will see the Event Sources sinked to Broker
              And user will see the Broker
              And user will see the Subscribers
              And user will see the Details tab
