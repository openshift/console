@knative-kafka
Feature: Kafka Event Sink
    User should be able to create Kafka sink by adding BootStrapServer and Topic


        Background:
            Given user has created or selected namespace "kafka-sink-aut-1"


        @regression @odc-6741
        Scenario: Create Kafka sink by creating BootStrapServer and Topics: KS-01-TC01
             When user clicks on Event Sink card
              And user selects sinks provided by Red Hat
              And user clicks on "KafkaSink" card
              And user clicks on Create Event Sink
              And user switches to form view
              And user creates a BootStrapServer as "http://my-server.com"
              And user creates a Topic as "kafka-topic"
              And user enters name as "kafka-sink-test3"
              And user clicks on Create button for kafkasink form
             Then user will see "kafka-sink-test3" created in topology

