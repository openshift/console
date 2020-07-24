Feature: Usability Enhancement for Eventing
    User should be able to select BootStrapServers and Topics from provided options


Background:
   Given cluster with OpenShift Serverless Operator installed
   And Kafka Operator installed
   And BootStrapServers and Topics created


@regression, @smoke
Scenario: BootStrapServers and Topics Drop Down
    Given user is at Developer Perspective
    When user goes to +Add page
    And user clicks on Event Sources card
    And user clicks on Kafka Sources
    Then user will see the items in BootStrapServers dropdown
    And user will see the items in Topics dropdown


@regression, @smoke
Scenario: Multiple BootStrapServers and Topics under their dropdown
    Given user is at Developer Perspective
    When user creates a BootStrapServer
    And user creates a Topics
    And user clicks on Event Sources card
    And user clicks on Kafka Sources
    Then user will see that server in BootStrapServers dropdown
    And user will see that topic in Topics dropdown


@regression, @smoke
Scenario: Select multiple BootStrapServers and Topics from dropdown
    Given user is at Developer Perspective
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


@regression, @smoke
Scenario: Enter BootStrapServers and Topics
    Given user is at Developer Perspective
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


@regression, @smoke, @manual
Scenario: New Event Sources Icon
    Given user is at Developer Perspective
    When user goes to +Add page
    And user clicks on Event Sources card
    Then user will see the new Event Sources Icon
