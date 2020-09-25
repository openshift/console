Feature: Knative Eventing Channel Support
    User should be able to experience the Knative Eventing Channel and associated features


Background: 
    Given user has installed the OpenShift Serverless Operator
    And user has created knative serving
    And user has create knative eventing


@regression
Scenario: Channel card on the +Add page
    Given user is at Developer Perspective
    When user goes to +Add page
    Then user will see the Channel card on the +Add page


@regression
Scenario: Create InMemoryChannel
    Given user is at Developer Perspective
    When user goes to +Add page
    And user clicks on the Channel card
    And user selects auto selected InMemoryChannel from Type dropdown
    And user selects Application
    And user enters the name of the Channel
    And user clicks on the Create button
    Then user will see the channel created


@regression
Scenario: Sink event source to Channel
    Given user is at Developer Perspective
    When user creates the channel 
    And user goes to +Add page
    And user clicks on the Event Source card
    And user selects Ping Source card
    And user enters Schedule
    And user selects the channel from Resource dropdown
    And user selects the Application
    And user enters name of the event source
    And user clicks on the Create button
    Then user will see that event source is connected to channel


@regression, @manual
Scenario: Sink multiple event sources to Channel
    Given user is at Developer Perspective
    And user has event source sinked to channel on topology page
    When user goes to +Add page
    And user clicks on the Event Source card
    And user selects Ping Source card
    And user enters Schedule
    And user selects the channel from Resource dropdown
    And user selects the Application
    And user enters name of the event source
    And user clicks on the Create button
    Then user will see that multiple event sources are connected to single channel


@regression
Scenario: Context Menu for Channel
    Given user is at Developer Perspective
    When user creates the channel
    And user right clicks on the channel
    Then user will see the Context Menu for channel
    And user will see Edit Application Groupings option
    And user will see Add Subscribtion option
    And user will see Edit Labels option
    And user will see Edit Annotations option
    And user will see Edit InMemoryChannel option
    And user will see Delete InMemoryChannel option


@regression
Scenario: Edit Application Groupings action on Channel
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    When user right clicks on the Channel to open the context menu
    And user clicks on the Edit Application Groupings
    And user will click on the Application dropdown on the modal
    And user selects the Application
    And user clicks on Save button
    Then user will see the changed Application Groupings of Channel


@regression
Scenario: Edit Application Groupings to unassigned action on Channel
    Given user is at Developer Perspective
    And user is having a Channel inside an applicaiton group on the Topology page
    When user right clicks on the Channel to open the context menu
    And user clicks on the Edit Application Groupings
    And user will click on the Application dropdown on the modal
    And user selects the unassigned item
    And user clicks on Save button
    Then user will see that Channel is without an application group


@regression
Scenario: Edit Labels action on Channel
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    When user right clicks on the Channel to open the context menu
    And user clicks on the Edit Labels
    And user adds the label
    And user clicks on the Save button on the modal to save labels and close the modal
    And user clicks on the Channel to open the sidebar
    And user opens   the Details tab
    Then user will see the newly added label


@regression
Scenario: Edit Annotations action on Channel
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    When user right clicks on the Channel to open the context menu
    And user clicks on the Edit Annotations
    And user adds the annotations
    And user clicks on the Save button on the modal to save annotation and close the modal
    And user clicks on the Channel to open the sidebar
    And user opens the Details tab
    Then user will see the newly added annotation


@regression
Scenario: Edit Channel action on Channel
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    When user right clicks on the Channel to open the context menu
    And user clicks on the Edit InMemoryChannel
    Then user will see the YAML editor to edit the channel


@regression
Scenario: Delete Channel action on Channel
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    When user right clicks on the Channel to open the context menu
    And user clicks on the Delete InMemoryChannel
    And user clicks on the Delete button on the modal
    Then Channel will get deleted
    And user won't be able to see the Channel again


@regression
Scenario: Sidebar for the Channel
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    When user clicks on the Channel to open the sidebar
    Then user will see the Resources tab
    And user will see the Details tab


@regression
Scenario: Details tab for the Channel
    Given user is at Developer Perspective
    And user is having Channel on the Topology page
    When user clicks on the Channel to open the sidebar
    And user opens Details tab
    Then user will see name of channel
    And user will see namespace of channel
    And user will see labels and annotations associated with channel
    And user will see the owner and channel created time


@regression
Scenario: Sidebar for the Channel subscribed to Knative Service
    Given user is at Developer Perspective
    And user is having Channel subscribed to Knative Service on the Topology page
    When user clicks on the Channel to open the sidebar
    Then user will see the Resources tab
    And user will see the Subscribers


@regression
Scenario: Sidebar for the channel connected with eventsources and knative services
    Given user is at Developer Perspective
    And user is having Channel subscribed to Knative Service and event source connected to it on the Topology page
    When user clicks on the Channel to open the sidebar
    Then user will see the Resources tab
    And user will see the Event Sources sinked to channel
    And user will see the Subscribers
