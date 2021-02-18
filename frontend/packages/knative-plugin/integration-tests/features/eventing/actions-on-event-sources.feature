@knative-eventing
Feature: Event Sources actions
              As a user, I want to perform actions on event sources

        Background:
            Given user has created or selected namespace "aut-event-source-actions"
              And user has created knative service "nodejs-ex-git"
              And user has created "sink-binding" event source


        @regression
        Scenario: Event source context menu options : Kn-11-TC01
             When user right clicks on the event source "sink-binding" to open context menu
             Then user is able to see context menu
              And user can see options Edit Application Groupings, Move Sink, Edit Labels, Edit Annotations, Edit SinkBinding, Delete SinkBinding


        @smoke
        Scenario: Move sink to different knative service using context menu: Kn-11-TC02
            Given user has created another knative service "nodejs-ex-git-1"
              And knative service, event source and sink connector are present in topology page
             When user right clicks on the event source "sink-binding" to open context menu
              And user selects "Move sink" from context menu
              And user selects the knative service "nodejs-ex-git-1" from Resource dropdown
              And user clicks on save
             Then user will see that event source "sink-binding" is sinked with knative Service "nodejs-ex-git-1"


        @smoke
        Scenario: Delete event source : Kn-11-TC06
            Given knative service, event source and sink connector are present in topology page
             When user right clicks on the event source "sink-binding" to open context menu
              And user selects "Delete SinkBinding" from context menu
              And user selects the Delete option on "Delete SinkBinding?" modal
             Then event source "sink-binding" will not be displayed in topology page
