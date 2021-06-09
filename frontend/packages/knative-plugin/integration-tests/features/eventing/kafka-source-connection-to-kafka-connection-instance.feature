@kafka @odc-5399
Feature: Connection from Kafka Source to Managed Kafka Connection resource
              As a user, in topology view would like to drag a connection from the existing Kafka Source to Kafka Connection (KC) so that Kafka Source gets updated with bootstrap server/host url, SASL secrets, TLS enabled so that I don't need to provide those manually


        Background:
            Given user is at developer perspective
              And user has installed Serverless Operator
              And user has created Knative Kafka instance in knative-eventing namespace
              And user has installed RHOAS Operator
              And user has created or selected namespace "aut-kafka-connector"


        @smoke @to-do
        Scenario: Creating Kafka source connecting Kafka Connection and knative service: KM-01-TC01
            Given user has created knative service "hello-openshift1"
              And user has created Kafka Connection "kafka-instance-123"
              And user has created Topic "strimzi-canary"
              And user is at Add page
             When user clicks Event Source card
              And user clicks on Kafka Source card
              And user selects the value of "kafka-instance-123" Kafka Connection host url in Bootstrap servers field
              And user enters value "strimzi-canary" in Topics
              And user enters value "foobar" in Consumer group section
              And user checks the Enable checkbox under SASL
              And user selects resource "rh-cloud--services-service-account" under User
              And user selects key as "client-id" under User
              And user selects resource "rh-cloud--services-service-account" under Password
              And user selects key as "client-secret" under Password
              And user checks the Enable checkbox under TLS
              And user selects Resource under SinK as "hello-openshift1"
              And user selects Application group as "No Application group"
              And user enters Application Name as "kafka-source-1"
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user is able to see connection between Kafka Connection "kafka-instance-123" and knative service "hello-openshift1" from kafka source "kafka-source-1"


        @regression @to-do
        Scenario: Sidebar of the Kafka connector: KM-01-TC02
            Given user has created knative service "hello-openshift1"
              And user has created Kafka Connection "kafka-instance-123"
              And user has created connection between Kafka Connection "kafka-instance-123" and kafka source "kafka-source-1" which sinks to knative service "hello-openshift1"
              And user is at Topology page
             When user clicks on the connector connecting to Kafka Connection "kafka-instance-123" from kafka source "kafka-source-1"
             Then user will see kafka source "kafka-source-1" and Kafka Connection "kafka-instance-123" under Connection in Resource tab of sidebar


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
