@knative-eventing
Feature: Event Sources actions
              As a user, I want to perform actions on event sources


        Background:
            Given user has created or selected namespace "aut-knative"


        @smoke
        Scenario: Event source context menu options: KE-01-TC01
            Given user has created knative service "nodejs-ex-git"
              And user has created Sink Binding event source "sink-binding" with knative resource "nodejs-ex-git"
              And user is at Topology page
             When user right clicks on the event source "sink-binding" to open context menu
             Then user is able to see context menu
              And user can see options Edit Application Groupings, Move Sink, Edit Labels, Edit Annotations, Edit SinkBinding, Delete SinkBinding


        @smoke
        Scenario: Sink Event Source with existing knative service: KE-01-TC02
            Given user has created knative service "nodejs-ex-git"
              And user has created Sink Binding event source "sink-binding" with knative resource "nodejs-ex-git"
              And user has created knative service "nodejs-ex-git-1"
              And user is at Topology page
             When user right clicks on the event source "sink-binding" to open context menu
              And user selects "Move sink" from context menu
              And user selects the Resource "nodejs-ex-git-1" in "Move sink" modal
              And user clicks on save
             Then user will see that event source "sink-binding" is sinked with knative Service "nodejs-ex-git-1"


        @regression
        Scenario: Delete event source: KE-01-TC03
            Given user has created knative service "nodejs-ex-git-2"
              And user has created Sink Binding event source "sink-event" with knative resource "nodejs-ex-git-2"
             When user clicks on event source "sink-binding" to open side bar
              And user selects "Delete SinkBinding" from side bar Action menu
              And user selects the Delete option on "Delete SinkBinding?" modal
             Then event source "sink-event" will not be displayed in topology page
