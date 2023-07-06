@knative-kafka @knative
Feature: Kafka Event Sink
    User should be able to create Kafka sink by adding BootStrapServer and Topic


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "kafka-sink-aut-1"


        @regression @odc-6741
        Scenario: Create kafka sink by creating BootStrapServer and Topics: KS-01-TC01
            Given user is at Add page
              And user selects Event Sink card
              And user selects sinks provided by Red Hat
              And user clicks on "KafkaSink" card
              And user clicks on Create Event Sink
              And user switches to form view
              And user creates a BootStrapServer as "http://my-server.com"
              And user creates a Topic as "kafka-topic"
              And user enters name as "kafka-sink-test3"
              And user clicks on Create button for kafkasink form
             Then user will see "kafka-sink-test3" created in topology
        
        
        @regression @odc-6741
        Scenario: Add kafka sink as Trigger to Broker: KS-01-TC02
            Given user has created Broker "broker-test1" in topology
              And user has created KafkaSink "kafka-sink-test3" in topology
              And user is at Topology page
              And user is at Topology Graph view
             When user right clicks on the Broker "broker-test1" to open the context menu
              And user clicks on the Add Trigger
              And user selects the auto populated name of subscription
              And user will click on the Subscriber dropdown on the modal
              And user selects the Subscriber "kafka-sink-test3"
              And user clicks on Add button
             Then user will see connection between Broker and Subscriber


        @regression @odc-6741
        Scenario: Add kafka sink as Subscription to channel: KS-01-TC03
            Given user has created Channel "channel-test1" in topology
              And user has created KafkaSink "kafka-sink-test3" in topology
              And user is at Topology page
              And user is at Topology Graph view
             When user right clicks on the Channel "channel-test1" to open the context menu
              And user selects "Add Subscription" from Context Menu
              And user enters Name as "channel-subscrip" on Add Subscription modal
              And user selects Subscriber "kafka-sink-test3" on Add Subscription modal
              And user clicks on Add button
             Then user will see connection between Channel "channel-test1" and Subscriber "kafka-sink-test3"


        @regression @odc-6741
        Scenario: Sink Event Source with existing kafka sink: KE-01-TC04
            Given user has created knative service "nodejs-ex-git"
              And user has created Sink Binding event source "sink-binding" with knative resource "nodejs-ex-git"
              And user has created KafkaSink "kafka-sink-test3" in topology
              And user is at Topology page
             When user right clicks on the event source "sink-binding" to open context menu
              And user selects "Move sink" from context menu
              And user selects the Resource "kafka-sink-test3" in "Move sink" modal
              And user clicks on save
             Then user will see that event source "sink-binding" is sinked with kafka sink "kafka-sink-test3"


        @regression @odc-6741
        Scenario: Delete kafka sink: KS-01-TC05
            Given user is at Topology page
              And user is at Topology Graph view
              And user has created KafkaSink "kafka-sink-test3" in topology
             When user selects "Delete KafkaSink" context menu option of kafka sink "kafka-sink-test3"
              And user clicks Delete button on Delete modal
             Then user will not see "kafka-sink-test3" in topology
     
