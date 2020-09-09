Feature: Event Sources actions
    As a developer I want to perform actions on event sources

Background:
   Given open shift cluster is installed with Serverless operator
   And user is at developer perspecitve
   And user is at Add page
   And user has selected namespace "aut-create-knative-event-source"


@regression, @smoke
Scenario: Evnt source context menu options : Kn-11-TC01
   Given knative service named "nodejs-ex-git" is higlighted on topology page
   And event source "sink-binding" is higlighted on topology page
   When user right clicks on the event source
   Then user is able to see context menu 
   And user can see options Edit Application Groupings, Move Sink, Edit Labels, Edit Annotations, Edit SinkBinding, Delete SinkBinding


@regression, @smoke
Scenario: Move the sink via context menu to link differnt knative Service : Kn-11-TC02
   Given knative services named "nodejs-ex-git" and "nodejs-ex-git-1" are higlighted on topology page
   And event source "sink-binding" is higlighted on topology page
   And knative service, event source and sink connector are present in topology page
   When user right clicks on the event source
   And user selects "Move Sink" from context menu
   And selects the knative service "nodejs-ex-git-1" from Resource dropdown
   And user clicks on save
   Then user is connected to differnt knative Service "nodejs-ex-git-1"


@regression, @smoke
Scenario: Delete event source : Kn-11-TC06
   Given knative service named "nodejs-ex-git" is higlighted on topology page
   And event source "sink-binding" is higlighted on topology page
   And knative service, event source and sink connector are present in topology page
   When user right clicks on the event source
   And user selects "Delete SinkBinding" from context menu
   And selects the Delete option on "Delete SinkBinding?" modal
   Then event source "sink-binding" will not be displayed in topology page
