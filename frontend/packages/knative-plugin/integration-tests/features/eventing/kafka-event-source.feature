@kafka
Feature: Kafka Event Source
    User should be able to create Kafka source by selecting multiple BootStrapServers and Topics from provided options


        Background:
            Given user has installed Serverless Operator
              And user has created Knative Kafka instance with source enabled true in knative-eventing namespace
              And user has installed Red Hat Integration - AMQ Streams operator
              And user has created Kafka instance and Topics
              And user is at developer perspective
              And user has created or selected namespace "aut-kafka"


        @regression @to-do
        Scenario: BootStrapServers and Topics Drop Down: KF-02-TC01
             When user navigates to Add page
              And user clicks on "Event Source" card
              And user clicks on Kafka Source
              And user clicks on Create Event Source on Kafka Source side pane
             Then user will see the items in BootStrapServers dropdown
              And user will see the items in Topics dropdown


        @regression @to-do
        Scenario: Create Kafka source with exisitng multiple BootStrapServers and Topics: KF-02-TC02
            Given user has created knative revision with knative service "nodejs-ex-git-2"
              And user is at Event Sources page
             When user creates a BootStrapServer
              And user creates a Topics
              And user clicks on "Event Source" card
              And user clicks on Kafka Source
              And user selects multiple BootStrapServers
              And user selects multiple Topics
              And user selects Sink
              And user selects Application
              And user enters Kafka Source name as "kafka-source-1"
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user can see the Kafka source "kafka-source-1"


        @regression @to-do
        Scenario: Create Kafka source by creating BootStrapServers and Topics: KF-02-TC03
            Given user has created knative revision with knative service "nodejs-ex-git-3"
              And user is at Event Sources page
             When user creates a BootStrapServer
              And user creates a Topics
              And user clicks on "Event Source" card
              And user clicks on Kafka Source
              And user enters the BootStrapServer name "bootstrapserver-name"
              And user enters the Topic name "topic-name"
              And user selects Sink
              And user selects Application
              And user enters Kafka Source name as "kafka-source-2"
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user can see the Kafka source "kafka-source-2"
