@knative
Feature: Kafka Event Source
  User should be able to create Kafka source by selecting multiple BootStrapServers and Topics from provided options


        Background:
            Given user has installed OpenShift Serverless Operator
              And user has created Knative Kafka instance with source enabled true in knative-eventing namespace
              And user has installed Red Hat Integration - AMQ Streams operator
              And user has created or selected namespace "aut-kafka"


        @regression
        Scenario: BootStrapServers and Topics Drop Down: KF-02-TC01
            Given user has created Kafka instance and Topics
              And user is at developer perspective
             When user navigates to Add page
              And user clicks on Event Source card
              And user clicks on Kafka Source
              And user clicks on Create Event Source on Kafka Source side pane
             Then user will see the items in BootStrapServers dropdown
              And user will see the items in Topics dropdown


        @regression
        Scenario: Create Kafka source with existing multiple BootStrapServers and Topics: KF-02-TC02
            Given user is at developer perspective
              And user has created knative revision with knative service "nodejs-ex-git-2"
             When user is at Event Sources page
              And user clicks on Kafka Source
              And user clicks on Create Event Source on Kafka Source side pane
              And user selects multiple BootStrapServers
              And user selects multiple Topics
              And user enters consumer group name as "group"
              And user verify that Target resource is selected
              And user verify that Application is selected
              And user enters Kafka Source name as "kafka-source-1"
              And user clicks on Create button on EventSource page
             Then user will be redirected to Topology page
              And user can see the Kafka source "kafka-source-1"


        @regression
        Scenario: Create Kafka source by creating BootStrapServers and Topics: KF-02-TC03
            Given user is at developer perspective
              And user has created knative revision with knative service "nodejs-ex-git-3"
             When user is at Event Sources page
              And user clicks on Kafka Source
              And user clicks on Create Event Source on Kafka Source side pane
              And user creates BootStrapServer name "bootstrapserver-name"
              And user creates Topic name "topic-name"
              And user enters consumer group name as "group"
              And user verify that Target resource is selected
              And user verify that Application is selected
              And user enters Kafka Source name as "kafka-source-2"
              And user clicks on Create button on EventSource page
             Then user will be redirected to Topology page
              And user can see the Kafka source "kafka-source-2"
