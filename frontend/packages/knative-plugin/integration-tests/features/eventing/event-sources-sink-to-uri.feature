@knative-eventing
Feature: Event Sources can able sink to URI as well as Resource
    User should be able to sink Event Sources with resource as well as with URI


        Background:
            Given user has created or selected namespace "aut-knative"
              And user has created knative service "kn-event"
              And user is at Add page


        @regression
        Scenario: Context Menu for URI: KE-03-TC01
            Given user has sinked event source "sink-binding" to URI "http://cluster.example.com/svc"
              And user is at Topology page
             When user right clicks on URI "http://cluster.example.com/svc" to open context menu
             Then user is able to see a context menu with option "Edit URI"


        @smoke
        Scenario: Update the URI for Sink Binding: KE-03-TC02
            Given user has sinked event source "sink-binding" to URI "http://cluster.example.com/svc"
              And user is at Topology page
             When user right clicks on URI "http://cluster.example.com/svc" to open context menu
              And user selects "Edit URI" from context menu
              And user enters the uri as "http://cluster.example.com/svc-1" in "Edit URI" modal
              And user clicks on save
             Then user will see that event source "sink-binding" is sinked with uri "http://cluster.example.com/svc-1"


        @regression @manual
        Scenario: Sidebar for URI: KE-03-TC03
            Given user has sinked an event source to URI
              And user is at Topology page
             When user clicks on URI
             Then user will see a sidebar opened for URI
              And user will see only Resources tab on the sidebar
              And user will see the associated resources on the Resources tab


        @regression @manual
        Scenario: Sidebar for Event Source sinked with URI: KE-03-TC04
            Given user has sinked an event source to URI
              And user is at Topology page
             When user clicks on event source
              And user clicks on the Resources tab
             Then user will Sink URI option on the Resources tab


        @regression @manual
        Scenario: Sidebar for Connector: KE-03-TC05
            Given user has sinked an event source to URI
              And user is at Topology page
             When user clicks on Connector
             Then user will see a sidebar opened for Connector
              And user will see only Resources tab on the sidebar
              And user will see the associated Connections on the Resources tab


        @to-do
        Scenario: Manually drag a Connector from URI to Knative Service: KE-03-TC06
            Given user has sinked an event source to URI
              And user has a Knative Service
              And user is at Topology page
             When user manually drags Connector from URI to Knative Service
             Then user will see that Event Source is now connected to Knative Service


        @regression @to-do
        Scenario: Move sink from URI to new Resource: KE-03-TC07
            Given user has sinked an event source to URI
              And user is at Topology page
             When user right clicks on the event source
              And user clicks on the Move Sink option
              And user selects sink to Resource option
              And user selects the resource from Select Resource dropdown
              And user clicks on Save button
             Then user will see that event source is now connected to new resource
              And user will see that the already existed URI will get vanished


        @regression @to-do
        Scenario: Move sink from URI to new URI: KE-03-TC08
            Given user has sinked an event source to URI
              And user is at Topology page
             When user right clicks on the event source
              And user clicks on the Move Sink option
              And user selects sink to URI option
              And user removes the privious URI
              And user enters the URI
              And user clicks on Save button
             Then user will see that event source is now connected to new URI


        @regression @manual
        Scenario: Move sink from Resource to same Resource: KE-03-TC09
            Given user has sinked an event source to Resource
              And user is at Topology page
             When user right clicks on the event source
              And user clicks on the Move Sink option
              And user selects sink to Resource option
              And user selects the same resource from Select Resource dropdown
             Then user will see that save button is disabled


        @regression @manual
        Scenario: Move sink from Resource to URI: KE-03-TC10
            Given user has sinked an event source to Resource
              And user is at Topology page
             When user right clicks on the event source
              And user clicks on the Move Sink option
              And user selects sink to URI option
              And user enters the URI
              And user clicks on Save button
             Then user will see that event source is now connected to new URI
