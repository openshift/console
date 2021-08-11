@knative-eventing
Feature: Perform actions on Broker
              As a user, I should be able to perform actions on broker
        
        
        Background:
            Given user has installed OpenShift Serverless Operator
              And user has created Knative Eventing CR
              And user has created Knative Serving CR
              And user has created or selected namespace "aut-eventing-broker-actions"
              And user is at Topology page
        
        
        @smoke @pre-condition @to-do @odc-5030
        Scenario: Create Broker using Form view: KE-05-TC01
            Given user is at Add page
             When user selects on "Broker" from "Eventing" card
              And user selects "Form view"
              And user enters broker name as "default-broker"
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see the "default-broker" broker created


        @regression @to-do @odc-5030
        Scenario: Context Menu for Broker: KE-05-TC02
            Given user has created broker "default" in application groupings "app"
             When user right clicks on "default" broker
             Then user will see "Edit Application grouping" option
              And user will see "Add Trigger" option
              And user will see "Edit labels" option
              And user will see "Edit annotations" option
              And user will see "Edit Broker" option
              And user will see "Delete Broker" option


        @regression @to-do @odc-5030
        Scenario: Details tab for the Broker: KE-05-TC03
             When user clicks on "default" broker to open the sidebar
              And user selects Details tab
             Then user will see name of broker as "default"
              And user will see namespace of broker as "aut-eventing-broker-actions"
              And user will see labels and annotations associated with broker
              And user will see the owner and broker created time


        @regression @to-do @odc-5030
        Scenario: Edit Application grouping to new application action on Broker: KE-05-TC04
             When user right clicks on "default" broker to open the context menu
              And user clicks on "Edit Application grouping"
              And user will click on Application drop down on the modal
              And user selects "Create Application" from Application drop down
              And user enters application name as "new-app"
              And user clicks on Save button
             Then user will see "new-app" application created

        
        #Please add the respective test data
        @regression @to-do @odc-5030
        Scenario: Edit Labels action on Broker: KE-05-TC05
             When user right clicks on "default" broker to open the context menu
              And user clicks on "Edit labels"
              And user adds new label
              And user clicks on the Save button on the modal
              And user clicks on "default" Broker to open the sidebar
              And user selects Details tab
             Then user will see the newly added label


        #Please add the respective test data
        @regression @to-do @odc-5030
        Scenario: Edit Annotations action on Broker: KE-05-TC06
             When user right clicks on "default" broker to open the context menu
              And user clicks on "Edit annotations"
              And user adds new annotations
              And user clicks on the Save button on the modal
              And user clicks on "default" broker to open the sidebar
              And user selects Details tab
             Then user will see the newly added annotations


        @regression @manual
        Scenario: Edit Broker action on Broker: KE-05-TC07
             When user clicks on "default" Broker to open the sidebar
              And user selects "Edit Broker" from Actions drop down
              And user edits broker YAML
              And user clicks on Save button
             Then user will see the updated YAML
              And user will see Details and Triggers tab on broker details page


        @regression @to-do @odc-5030
        Scenario: Add Trigger to Broker: KE-05-TC08
            Given user has created knative service "kn-service"
              And user is at Topology page
             When user clicks on "default" broker to open the sidebar
              And user selects "Add Trigger" from Actions drop down
              And user enters name of trigger as "default-trigger"
              And user selects "kn-service" from Subscriber drop down
              And user clicks on Add button
             Then user will see "default-trigger" created


        @regression @to-do @odc-5030
        Scenario: Sidebar for the Broker connected with eventsources and knative services: KE-05-TC09
            Given user has "ping-source" event source sinked to "default" broker
             When user clicks on "default" broker to open the sidebar
              And user selects Resources tab
             Then user will see "ping-source" under EventSources
              And user will see "kn-service" under Subscribers
              And user will see Pods and Deployments section


        @regression @to-do @odc-5030
        Scenario: Edit Application grouping to no application group action on Broker: KE-05-TC10
             When user right clicks on "default" broker to open the context menu
              And user clicks on "Edit Application grouping"
              And user will click on Application drop down on the modal
              And user selects "No Application group" from Application drop down
              And user clicks on Save button
             Then user will not see "new-app" application

        
        @regression @to-do @odc-5030
        Scenario: Delete Broker action on Broker: KE-05-TC11
             When user clicks on "default" Broker to open the sidebar
              And user selects "Delete Broker" from Actions drop down
              And user clicks on the Delete button on the modal
             Then user will not see "default" broker
