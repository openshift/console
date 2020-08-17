Feature: Event Sources actions
    As a developer I want to perform actions on event sources

Background:
   Given open shift cluster is installed with Serverless operator
   And user is on dev perspective +Add page
   And open the project "aut-knative-event-source-actions"


@regression, @smoke
Scenario: Side pane display of event source : Kn-12-TC01
   Given knative service, event source and sink connector are present in topology page
   When user clicks on event source
   Then side pane is dsiplays with header name as "{event source name}"


@regression, @smoke
Scenario: Move the sink via Action menu to link knative Service : Kn-12-TC02
   Given knative service, event source and sink connector are present in topology page
   When user clicks on event source
   And select the "Move Sink" from Action menu present in right side pane
   Then modal displays with the header name "Move Sink" 
   And knative service dropdown is displayed
