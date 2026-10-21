@knative-eventing @knative
Feature: Perform actions on Broker
              As a user, I should be able to perform actions on broker


        Background:
            Given user has created or selected namespace "aut-eventing-broker-actions"
              And user is at developer perspective


        @smoke @pre-condition
        Scenario: Create Broker using Form view: KE-05-TC01
            Given user is at Add page
             When user selects on "Broker" from "Eventing" card
              And user selects Form view
              And user enters broker name as "default-broker" in application groupings "app"
              And user clicks on Create button to create broker
             Then user will be redirected to Topology page
              And user will see the "default-broker" broker created


        @regression
        Scenario: Context Menu for Broker: KE-05-TC02
            Given user has created broker "default-broker" in application groupings "app"
             When user right clicks on "default-broker" broker
             Then user will see option "Edit application grouping"
              And user will see option "Add Trigger"
              And user will see option "Edit labels"
              And user will see option "Edit annotations"
              And user will see option "Edit Broker"
              And user will see option "Delete Broker"


        @regression
        Scenario: Details tab for the Broker: KE-05-TC03
             When user clicks on the "default-broker" broker to open the sidebar
              And user selects Details tab
             Then user will see name of broker as "default-broker"
              And user will see namespace of broker as "aut-eventing-broker-actions"
              And user will see labels and annotations associated with broker
              And user will see the owner and broker created time


        @regression
        Scenario: Edit Application grouping to new application action on Broker: KE-05-TC04
             When user right click on the "default-broker" broker to open the context menu
              And user clicks on "Edit application grouping"
              And user will click on Application drop down on the modal
              And user selects "Create application" from Application drop down
              And user enters application name as "app"
              And user clicks on Save button
             Then user will see "app" application created


     #Please add the respective test data
        @regression
        Scenario: Edit Labels action on Broker: KE-05-TC05
             When user right click on the "default-broker" broker to open the context menu
              And user clicks on "Edit labels"
              And user adds new label "app.kubernetes.io/broker-label=12"
              And user clicks on the Save button on the modal
              And user clicks on the "default-broker" broker to open the sidebar
              And user selects Details tab
             Then user will see the newly added label "app.kubernetes.io/broker-label=12"


     #Please add the respective test data
        @regression
        Scenario: Edit Annotations action on Broker: KE-05-TC06
             When user right click on the "default-broker" broker to open the context menu
              And user clicks on "Edit annotations"
              And user adds new annotation "eventing.knative.dev/broker.annotations" and type "test-annotation"
              And user clicks on the Save button on the modal
              And user clicks on the "default-broker" broker to open the sidebar
              And user selects Details tab
             Then user will see the newly added annotation "eventing.knative.dev/broker.annotations" and type "test-annotation"


        @regression @manual
        Scenario: Edit Broker action on Broker: KE-05-TC07
             When user clicks on "default-broker" Broker to open the sidebar
              And user selects "Edit Broker" from Actions drop down
              And user edits broker YAML
              And user clicks on Save button
             Then user will see the updated YAML
              And user will see Details and Triggers tab on broker details page


        @regression
        Scenario: Add Trigger to Broker: KE-05-TC08
            Given user has created knative service "kn-service"
              And user is at Topology page
             When user clicks on the "default-broker" broker to open the sidebar
              And user selects "Add Trigger" from Actions drop down
              And user enters name of trigger as "default-trigger"
              And user selects "kn-service" from Subscriber drop down
              And user clicks on Add button
             Then user will see "default-trigger" created


        @regression
        Scenario: Sidebar for the Broker connected with eventsources and knative services: KE-05-TC09
            Given user has ping-source event source sinked to "default-broker" broker
             When user clicks on the "default-broker" broker to open the sidebar
              And user selects Resources tab
             Then user will see "ping-source" under EventSources
              And user will see "kn-service" under Subscribers
              And user will see Pods and Deployments section


        @regression
        Scenario: Edit Application grouping to no application group action on Broker: KE-05-TC10
             When user right click on the "default-broker" broker to open the context menu
              And user clicks on "Edit application grouping"
              And user will click on Application drop down on the modal
              And user selects "No application group" from Application drop down
              And user clicks on Save button
             Then user will not see "app" application


        @regression
        Scenario: Delete Broker action on Broker: KE-05-TC11
             When user clicks on the "default-broker" broker to open the sidebar
              And user selects "Delete Broker" from Actions drop down
              And user clicks on the Delete button on the modal
             Then user will not see "default-broker" broker
