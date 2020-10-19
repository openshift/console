Feature: Knative Eventing Broker Support
    User should be able to experience the Knative Eventing Broker and associated features


Background:
    Given user has installed the OpenShift Serverless Operator
    And user has created knative serving
    And user has create knative eventing


#Command: oc label namespace 'namespace-name' knative-eventing-injection=enabled

@regression, @manual
Scenario: Create default Broker
    Given user has logged in to cluster through CLI
    When user runs the command to add the labels
    And user visits the topology page
    Then user will see the default broker created


@regression
Scenario: Sink event source to Broker
    Given user is at Developer Perspective
    And user has created the Broker
    When user goes to +Add page
    And user clicks on the Event Source card
    And user selects Ping Source card
    And user enters Schedule
    And user selects the Broker from Resource dropdown
    And user selects the Application
    And user enters name of the event source
    And user clicks on the Create button
    Then user will see that event source is connected to Broker


@regression, @manual
Scenario: Sink multiple event sources to Broker
    Given user is at Developer Perspective
    And user has event source sinked to Broker on topology page
    When user goes to +Add page
    And user clicks on the Event Source card
    And user selects Ping Source card
    And user enters Schedule
    And user selects the Broker from Resource dropdown
    And user selects the Application
    And user enters name of the event source
    And user clicks on the Create button
    Then user will see that multiple event sources are connected to single Broker


@regression
Scenario: Context Menu for Broker
    Given user is at Developer Perspective
    When user creates the Broker
    And user right clicks on the Broker
    Then user will see the Context Menu for Broker
    And user will see Edit Application Groupings option
    And user will see Add Subscribtion option
    And user will see Edit Labels option
    And user will see Edit Annotations option
    And user will see Edit InMemoryBroker option
    And user will see Delete InMemoryBroker option


@regression
Scenario: Edit Application Groupings action on Broker
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    When user right clicks on the Broker to open the context menu
    And user clicks on the Edit Application Groupings
    And user will click on the Application dropdown on the modal
    And user selects the Application
    And user clicks on Save button
    Then user will see the changed Application Groupings of Broker


@regression
Scenario: Edit Application Groupings to no application group action on Broker
    Given user is at Developer Perspective
    And user is having a Broker inside an applicaiton group on the Topology page
    When user right clicks on the Broker to open the context menu
    And user clicks on the Edit Application Groupings
    And user will click on the Application dropdown on the modal
    And user selects the no application group item
    And user clicks on Save button
    Then user will see that Broker is without an application group


@regression
Scenario: Edit Labels action on Broker
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    When user right clicks on the Broker to open the context menu
    And user clicks on the Edit Labels
    And user adds the label
    And user clicks on the Save button on the modal to save labels and close the modal
    And user clicks on the Broker to open the sidebar
    And user opens the Details tab
    Then user will see the newly added label


@regression
Scenario: Edit Annotations action on Broker
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    When user right clicks on the Broker to open the context menu
    And user clicks on the Edit Annotations
    And user adds the annotations
    And user clicks on the Save button on the modal to save annotation and close the modal
    And user clicks on the Broker to open the sidebar
    And user opens the Details tab
    Then user will see the newly added annotation


@regression
Scenario: Edit Broker action on Broker
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    When user right clicks on the Broker to open the context menu
    And user clicks on the Edit InMemoryBroker
    Then user will see the YAML editor to edit the Broker


@regression
Scenario: Delete Broker action on Broker
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    When user right clicks on the Broker to open the context menu
    And user clicks on the Delete InMemoryBroker
    And user clicks on the Delete button on the modal
    Then Broker will get deleted
    And user won't be able to see the Broker again


@regression
Scenario: Sidebar for the Broker
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    When user clicks on the Broker to open the sidebar
    Then user will see the Resources tab
    And user will see the Details tab


@regression
Scenario: Details tab for the Broker
    Given user is at Developer Perspective
    And user is having Broker on the Topology page
    When user clicks on the Broker to open the sidebar
    And user opens Details tab
    Then user will see name of Broker
    And user will see namespace of Broker
    And user will see labels and annotations associated with Broker
    And user will see the owner and Broker created time


@regression
Scenario: Sidebar for the Broker subscribed to Knative Service
    Given user is at Developer Perspective
    And user is having Broker subscribed to Knative Service on the Topology page
    When user clicks on the Broker to open the sidebar
    Then user will see the Resources tab
    And user will see the Subscribers


@regression
Scenario: Sidebar for the Broker connected with eventsources and knative services
    Given user is at Developer Perspective
    And user is having Broker subscribed to Knative Service and event source connected to it on the Topology page
    When user clicks on the Broker to open the sidebar
    Then user will see the Resources tab
    And user will see the Event Sources sinked to Broker
    And user will see the Subscribers
