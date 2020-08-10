Feature: Knative Eventing Channel and Subscription
    User should be able to subscribe the Channel to the Knative Service and perform actions on it


Background: 
    Given user has installed the OpenShift Serverless Operator
    And user has created knative serving
    And user has create knative eventing


@regression
Scenario: Add Subscription to channel
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    When user right clicks on the Channel to open the context menu
    And user clicks on the Add Subscription
    And user selects the auto populated name of subscription
    And user will click on the Subscriber dropdown on the modal
    And user selects the Subscriber
    And user clicks on Add button
    Then user will see connection between Channel and Subscriber


@regression, @manual
Scenario: Subscribe channel to multiple services 
    Given user is at Developer Perspective
    And user is having Channel subscribed to a service on the Topology page
    When user right clicks on the Channel to open the context menu
    And user clicks on the Add Subscription
    And user updates name of subscription
    And user will click on the Subscriber dropdown on the modal
    And user selects the Subscriber
    And user clicks on Add button
    Then user will see connection between Channel and Subscriber
    And user will see a single channel subscribed to multiple services


@regression
Scenario: Delete Subscription
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    And user has already added the subscription
    When user right clicks on the Subscription to open the context menu
    And user clicks on the Delete Subscription
    And user clicks on the Delete button on the modal
    Then subscription will get deleted
    

@regression
Scenario: Move Subscription
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    And user has already added the subscription
    When user right clicks on the Subscription to open the context menu
    And user clicks on the Move Subscription
    And user selects the Subscriber from dropdown
    And user clicks on Save button
    Then user will see connection between Channel and Subscriber


@regression, @manual
Scenario: Add Subscription using connector
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    When user drags the connector and drops it on graph
    And user clicks on Add Subscription
    And user enters name of subscription
    And user will click on the Subscriber dropdown on the modal
    And user selects the Subscriber
    And user clicks on Add button
    Then user will see connection between Channel and Subscriber


@regression
Scenario: Sidebar for the Event Source sinked Channel subscribed to Knative Service
    Given user is at Developer Perspective
    And user is having Channel subscribed to Knative Service on the Topology page
    When user clicks on the Subscription to open the sidebar
    Then user will see the Resources tab
    And user will see the Event Sources sinked to channel
    And user will see the Channel
    And user will see the Subscribers
    And user will see the Details tab
