@knative
Feature: Connection from Kafka Source to Managed Kafka Connection resource
              As a user, in topology view would like to drag a connection from the existing Kafka Source to Kafka Connection (KC) so that Kafka Source gets updated with bootstrap server/host url, SASL secrets, TLS enabled so that I don't need to provide those manually


        Background:
            Given user is at admin perspective
              And user has created Knative Kafka instance with source enabled true in knative-eventing namespace
              And user has installed RHOAS Operator
              And user has created or selected namespace "aut-kafka-connector"
              And user is at developer perspective


        @smoke
        Scenario: Creating Kafka source connecting Kafka Connection and knative service: KM-01-TC01
            Given user has created knative service "hello-openshift"
              And user has created Kafka Connection "kafka-instance"
              And user has created Secret "rh-cloud--services-service-account"
              And user is at Add page
             When user clicks on Event Source card
              And user clicks on Kafka Source
              And user clicks on Create Event Source on Kafka Source side pane
              And user selects the value of "kafka-instance" Kafka Connection host url in Bootstrap servers field
              And user creates Topic name "strimzi-canary"
              And user enters consumer group name as "foobar"
              And user checks the Enable checkbox under SASL
              And user selects resource "rh-cloud--services-service-account" under User
              And user selects key as "client-id" under User
              And user selects resource "rh-cloud--services-service-account" under Password
              And user selects key as "client-secret" under Password
              And user checks the Enable checkbox under TLS
              And user selects Resource under SinK as "hello-openshift"
              And user selects Application group as "No Application group"
              And user enters Application Name as "kafka-source"
              And user clicks on Create button on form page
             Then user will be redirected to Topology page
              And user is able to see connection between kafka source "kafka-source" and knative service "hello-openshift" from kafka connection "kafka-instance"

        @regression
        Scenario: Sidebar of the Kafka connector: KM-01-TC02
            Given user is at Topology page
              And user is able to see connection between kafka source "kafka-source" and knative service "hello-openshift" from kafka connection "kafka-instance"
             When user clicks on the connector connecting to kafka source "kafka-source" from kafka service "hello-openshift"
             Then user will see kafka source "kafka-source" and kafka service "hello-openshift" under Connection in Resource tab of sidebar


        @regression @manual
        Scenario: Joining the Kafka source with connector to different Kafka Connections: KM-01-TC03
            Given user has created knative service "hello-openshift1"
              And user has created Kafka Connections "kafka-instance-abcd" and "kafka-instance-123"
              And user has created connection between Kafka Connection "kafka-instance-123" and kafka source "kafka-source-1" which sink to knative service "hello-openshift1"
              And user is at Topology page
             When user drags and drops the connector connecting to Kafka Connection "kafka-instance-123" from kafka source "kafka-source-1" to Kafka connection "kafka-instance-abcd"
              And user clicks on the connectors
              And user clicks on the Action menu
              And user selects Move connector option
              And user selects Kafka Connection as "kafka-instance-123" from dropdown in Move connector modal
             Then user will see the connector connecting Kafka Connection "kafka-instance-123" from kafka source "kafka-source-1"
