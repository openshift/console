@knative-eventing @knative
Feature: Create event sinks
              As a user, I want to create event sinks

        Background:
            Given user has installed Red Hat Integration - Camel K Operator
              And user has created or selected namespace "aut-event-sink"
              And user has created channel "kn-channel"
              And user is at Add page


        @regression @odc-6390
        Scenario: Create event sink from Add page: KES-01-TC01
             When user clicks on Event Sink card
              And user clicks on "Log Sink" card
              And user clicks on Create Event Sink
              And user selects Output Target as "kn-channel"
              And user enters name as "event-sink-test1"
              And user clicks on Create button
             Then user will see "event-sink-test1" created in topology


        @regression @odc-6390
        Scenario: Create event sink from catalog page: KES-01-TC02
            Given user is at catalog page
             When user selects Types as Event Sinks
              And user clicks on "Log Sink" card
              And user clicks on Create Event Sink
              And user selects Output Target as "kn-channel"
              And user enters name as "event-sink-test2"
              And user clicks on Create button
             Then user will see "event-sink-test2" created in topology


        @regression @odc-6390
        Scenario: Create event sink with YAML view: KES-01-TC03
             When user clicks on Event Sink card
              And user clicks on "Log Sink" card
              And user clicks on Create Event Sink
              And user switches to YAML view
              And user clicks on Create button
             Then user will see "kamelet-log-sink" created in topology


        @regression @odc-6390
        Scenario: Create event sink from context menu: KES-01-TC04
            Given user is at Topology page
             When user right clicks in empty space of topology
              And user selects "Event Sink" from Add to project
              And user clicks on "Log Sink" card
              And user clicks on Create Event Sink
              And user selects Output Target as "kn-channel"
              And user enters name as "event-sink-test3"
              And user clicks on Create button
             Then user will see "event-sink-test3" created in topology


        @regression @manual @odc-6390
        Scenario: Create event sink through drag and drop from Broker: KES-01-TC05
            Given user created broker "test-broker"
              And user is at Topology page
             When user drags and drops connector to empty area in topology
              And user selects "Event Sink" from context menu
              And user clicks on "Log Sink" card
              And user clicks on Create Event Sink
              And user enters name as "event-sink-test10"
              And user clicks on Create button
             Then user will see "event-sink-test10" created in topology connected to broker "test-broker"


        @regression @manual @odc-6390
        Scenario: Create event sink through drag and drop from Broker: KES-01-TC06
            Given user created channel "test-channel"
              And user is at Topology page
             When user drags and drops connector to empty area in topology
              And user selects "Event Sink" from context menu
              And user clicks on "Log Sink" card
              And user clicks on Create Event Sink
              And user enters name as "event-sink-test20"
              And user clicks on Create button
             Then user will see "event-sink-test20" created in topology connected to channel "test-channel"
