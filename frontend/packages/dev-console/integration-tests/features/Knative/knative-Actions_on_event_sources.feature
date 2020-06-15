Feature: Event Sources actions
    As a developer I want to perform actions on event sources

Background:
   Given open shift cluster is installed with Serverless operator
   And user is on dev perspective +Add page
   And open the project "AUT-create-knative-event-source"


@regression, @smoke
Scenario: Evnt source context menu options : Kn-11-TC01
   Given event source "sink-binding" is higlighted on topology page
   When user right clicks on the event source
   Then user able to see context menu with options "Edit Application Grouping", "Move Sink" "Edit Labels", "Edit Annotations", "Edit SinkBinding", "Delete SinkBinding"


@regression, @smoke
Scenario: Move the sink via context menu to link differnt knative Service : Kn-11-TC02
   Given knative service, event source and sink connector are present in topology page
   When user right clicks on the event source
   And  selects "Move Sink" from context menu
   Then modal displays with the header name "Move Sink" 
   And knative service dropdown is displayed
