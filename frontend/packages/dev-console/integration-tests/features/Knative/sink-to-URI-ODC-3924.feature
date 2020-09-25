Feature: Event Sources can able sink to URI as well as Resource
    User should be able to sink Event Sources with resource as well as with URI


Background: 
    Given user has installed OpenShift Serverless Operator
    And user is at Developer perspective


@regression
Scenario: Resource and URI radio button on Event Sources Cards page
    Given user is at +Add page
    When user clicks on Event Sources card
    And user selects an event source card
    Then user will see the Resource radio button
    And user will see URI radio button


@regression, @manual
Scenario: Event Source sink to Resource 
    Given user is at +Add page
    When user clicks on Event Sources card
    And user selects an event source card
    And user selects sink to Resource option
    And user selects the resource from Select Resource dropdown
    And user fills other information
    And user clicks on the Create button
    Then user will be redirected to Topology page
    And user will see that event source is sinked with selected resource


@regression, @manual
Scenario: Event Source sink to URI 
    Given user is at +Add page
    When user clicks on Event Sources card
    And user selects an event source card
    And user selects sink to URI option
    And user enters the URI
    And user fills other information
    And user clicks on the Create button
    Then user will be redirected to Topology page
    And user will have a node of URI
    And user will see that event source is sinked with URI


@regression
Scenario: Context Menu for URI
    Given user has sinked an event source to URI
    And user is at Topology page
    When user right-clicks on URI
    Then user will see a context menu opened for URI 


@regression
Scenario: Edit URI option
    Given user has sinked an event source to URI
    And user is at Topology page
    When user right-clicks on URI
    And user clicks on Edit URI option
    Then user will be shown with modal to edit the URI


@regression, @manual
Scenario: Sidebar for URI
    Given user has sinked an event source to URI
    And user is at Topology page
    When user clicks on URI
    Then user will see a sidebar opened for URI
    And user will see only Resources tab on the sidebar
    And user will see the associated resources on the Resources tab


@regression, @manual
Scenario: Sidebar for Event Source sinked with URI
    Given user has sinked an event source to URI
    And user is at Topology page
    When user clicks on event source
    And user clicks on the Resources tab
    Then user will Sink URI option on the Resources tab


@regression, @manual
Scenario: Sidebar for Connector
    Given user has sinked an event source to URI
    And user is at Topology page
    When user clicks on Connector
    Then user will see a sidebar opened for Connector
    And user will see only Resources tab on the sidebar
    And user will see the associated Connections on the Resources tab


@regression, @manual
Scenario: Manually drag a Connector from URI to Knative Service
    Given user has sinked an event source to URI
    And user has a Knative Service
    And user is at Topology page
    When user manually drags Connector from URI to Knative Service
    Then user will see that Event Source is now connected to Knative Service


@regression
Scenario: Move sink option in Context Menu
    Given user has sinked an event source to URI
    And user is at Topology page
    When user right clicks on the event source
    And user clicks on the Move Sink option
    Then user will see a modal
    And user will see Resource radio button
    And user will see URI radio button


@regression
Scenario: Move sink from URI to new Resource
    Given user has sinked an event source to URI
    And user is at Topology page
    When user right clicks on the event source
    And user clicks on the Move Sink option
    And user selects sink to Resource option
    And user selects the resource from Select Resource dropdown
    And user clicks on Save button
    Then user will see that event source is now connected to new resource
    And user will see that the already existed URI will get vanished


@regression
Scenario: Move sink from URI to new URI
    Given user has sinked an event source to URI
    And user is at Topology page
    When user right clicks on the event source
    And user clicks on the Move Sink option
    And user selects sink to URI option
    And user removes the privious URI
    And user enters the URI
    And user clicks on Save button
    Then user will see that event source is now connected to new URI


@regression, @manual
Scenario: Move sink from Resource to same Resource
    Given user has sinked an event source to Resource
    And user is at Topology page
    When user right clicks on the event source
    And user clicks on the Move Sink option
    And user selects sink to Resource option
    And user selects the same resource from Select Resource dropdown
    Then user will see that save button is disabled


@regression, @manual
Scenario: Move sink from Resource to new Resource
    Given user has sinked an event source to Resource
    And user is at Topology page
    When user right clicks on the event source
    And user clicks on the Move Sink option
    And user selects sink to Resource option
    And user selects the resource from Select Resource dropdown
    Then user will see that event source is now connected to new resource


@regression, @manual
Scenario: Move sink from Resource to URI
    Given user has sinked an event source to Resource
    And user is at Topology page
    When user right clicks on the event source
    And user clicks on the Move Sink option
    And user selects sink to URI option
    And user enters the URI
    And user clicks on Save button
    Then user will see that event source is now connected to new URI
