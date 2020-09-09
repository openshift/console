Feature: Event Sources actions
    As a user, I want to perform actions on event sources

Background:
   Given user has installed OpenShift Serverless Operator
   And user is at developer perspecitve
   And user is at Add page
   And user has selected namespace "aut-create-knative-event-source"


@regression, @smoke
Scenario: Event source context menu options : Kn-11-TC01
   Given user has created knative service "nodejs-ex-git"
   And user has created "sink-binding" event source 
   When user right clicks on the event source "sink-binding" to open context menu
   Then user is able to see context menu 
   And user can see options Edit Application Groupings, Move Sink, Edit Labels, Edit Annotations, Edit SinkBinding, Delete SinkBinding


@regression, @smoke
Scenario: Move sink to different knative service using context menu: Kn-11-TC02
   Given user has created knative services "nodejs-ex-git" and "nodejs-ex-git-1"
   And user has created "sink-binding" event source
   And knative service, event source and sink connector are present in topology page
   When user right clicks on the event source "sink-binding" to open context menu
   And user selects "Move Sink" from context menu
   And user selects the knative service "nodejs-ex-git-1" from Resource dropdown
   And user clicks on save
   Then user will see that event source "sink-binding" is sinked with knative Service "nodejs-ex-git-1"


@regression, @smoke
Scenario: Delete event source : Kn-11-TC06
   Given knative service named "nodejs-ex-git" is higlighted on topology page
   And event source "sink-binding" is higlighted on topology page
   And knative service, event source and sink connector are present in topology page
   When user right clicks on the event source "sink-binding" to open context menu
   And user selects "Delete SinkBinding" from context menu
   And user selects the Delete option on "Delete SinkBinding?" modal
   Then event source "sink-binding" will not be displayed in topology page
