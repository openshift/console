@knative-eventing @knative
Feature: Knative Eventing Broker Support
              As a user, I should be able to create broker and sink it with event sources


        Background:
            Given user has created or selected namespace "aut-eventing-broker"


        @regression
        Scenario: Create Broker form: KE-10-TC01
            Given user is at Add page
             When user selects Broker from Developer Catalog card
             Then user will see Form view default selected
              And user will see YAML view radio button
              And user will see Application field for broker
              And user will see Name field for broker


        @regression
        Scenario: Create Broker using YAML view: KE-10-TC02
            Given user is at Add page
             When user selects Broker from Developer Catalog card
              And user selects YAML view
              And user clicks on Create button to create broker
             Then user will be redirected to Topology page
              And user will see the "default" broker created


        @smoke
        Scenario: Sink event source to Broker: KE-10-TC03
            Given user has created broker "default"
              And user is at Add page
             When user selects Event Source from Developer Catalog card
              And user selects "PingSource" event source
              And user clicks on Create Event Source button
              And user enters schedule as "* * * * *"
              And user selects "default" broker from Resource dropdown
              And user enters name "ping-source" of the PingSource event source
              And user clicks on the Create button
             Then user will be redirected to Topology page
              And user will see "ping-source" event source created
              And user will see event source connected to broker


        @regression
        Scenario: Sink multiple event sources to Broker: KE-10-TC04
            Given user has "ping-source" event source sinked to "default" broker
              And user is at Add page
             When user selects Event Source from Developer Catalog card
              And user selects "ApiServerSource" event source
              And user clicks on Create Event Source button
              And user enters apiVersion
              And user enters kind
              And user selects "default" broker from Resource dropdown
              And user enters name "api-server-source" of the EventSource event source
              And user clicks on the Create button
             Then user will be redirected to Topology page
              And user will see "api-server-source" event source created
              And user will see event source connected to broker