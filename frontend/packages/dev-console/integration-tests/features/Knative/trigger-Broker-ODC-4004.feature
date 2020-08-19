Feature: Knative Eventing Broker and Trigger
    User should be able to trigger the Broker to the Knative Service and perform actions on it


Background: 
    Given user has installed the OpenShift Serverless Operator
    And user has created knative serving
    And user has create knative eventing


@regression
Scenario: Add Trigger to Broker
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    When user right clicks on the Broker to open the context menu
    And user clicks on the Add Trigger
    And user selects the auto populated name of subscription
    And user will click on the Subscriber dropdown on the modal
    And user selects the Subscriber
    And user clicks on Add button
    Then user will see connection between Broker and Subscriber


@regression, @manual
Scenario: Add multiple trigger to Broker with multiple services 
    Given user is at Developer Perspective
    And user is having Broker subscribed to a service on the Topology page
    When user right clicks on the Broker to open the context menu
    And user clicks on the Add Trigger
    And user updates name of Trigger
    And user will click on the Subscriber dropdown on the modal
    And user selects the Subscriber
    And user clicks on Add button
    Then user will see connection between Broker and Subscriber
    And user will see a single Broker subscribed to multiple services


@regression
Scenario: Delete Trigger
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    And user has already added the trigger
    When user right clicks on the trigger to open the context menu
    And user clicks on the Delete Subscription
    And user clicks on the Delete button on the modal
    Then subscription will get deleted
    

@regression
Scenario: Move Trigger
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    And user has already added the trigger
    When user right clicks on the Trigger to open the context menu
    And user clicks on the Move Trigger
    And user selects the Subscriber from dropdown
    And user clicks on Save button
    Then user will see connection between Broker and Subscriber


@regression, @manual
Scenario: Add Trigger using connector
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    When user drags the connector and drops it on graph
    And user clicks on Add Trigger
    And user enters name of trigger
    And user will click on the Subscriber dropdown on the modal
    And user selects the Subscriber
    And user clicks on Add button
    Then user will see connection between Broker and Subscriber


@regression
Scenario: Sidebar for the Event Source sinked Broker subscribed to Knative Service
    Given user is at Developer Perspective
    And user is having Broker subscribed to Knative Service on the Topology page
    When user clicks on the Subscription to open the sidebar
    Then user will see the Resources tab
    And user will see the Event Sources sinked to Broker
    And user will see the Broker
    And user will see the Subscribers
    And user will see the Details tab
