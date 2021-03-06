@kafka
Feature: Kafka Event Source
    User should be able to create Kafka source by selecting multiple BootStrapServers and Topics from provided options


        Background:
            Given Kafka Operator installed
              And BootStrapServers and Topics created
              And user has created or selected namespace "aut-kafka"


        @regression
        Scenario: BootStrapServers and Topics Drop Down
             When user navig to Add page
              And user clicks on Event Sources card
              And user clicks on Kafka Sources
             Then user will see the items in BootStrapServers dropdown
              And user will see the items in Topics dropdown


        Scenario: Select multiple BootStrapServers and Topics from dropdown
             When user creates a BootStrapServer
              And user creates a Topics
              And user clicks on Event Sources card
              And user clicks on Kafka Sources
              And user selects multiple BootStrapServers
              And user selects multiple Topics
              And user selects Sink
              And user selects Application
              And user enters name for the Kafka Source
              And user clicks on Create button
             Then user gets redirected to Topology page
              And user can see the Kafka source created


        @regression
        Scenario: Enter BootStrapServers and Topics
             When user creates a BootStrapServer
              And user creates a Topics
              And user clicks on Event Sources card
              And user clicks on Kafka Sources
              And user enters the BootStrapServer name
              And user enters the Topic name
              And user selects Sink
              And user selects Application
              And user enters name for the Kafka Source
              And user clicks on Create button
             Then user gets redirected to Topology page
              And user can see the Kafka source created
