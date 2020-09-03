Feature: Event Sources actions
    As a developer I want to perform actions on event sources

Background:
   Given open shift cluster is installed with Serverless operator
   And user is at developer perspecitve
   And user has selected namespace "aut-knative-event-source-actions"
   And knative service "nodejs-ex-git-1" is available in topology page
   And event source "Sink Binding" is available on topology page


@regression, @smoke
Scenario: side bar display of event source : Kn-12-TC01
   Given knative service, event source and sink connector are present in topology page
   When user clicks on event source "Sink Binding"
   Then side bar dsiplays with header name as "Sink Binding"


@regression, @smoke
Scenario: Move the sink via Action menu to link knative Service : Kn-12-TC02
   Given knative service, event source and sink connector are present in topology page
   When user clicks on event source "Sink Binding"
   And select the "Move Sink" from Action menu present in right side bar
   Then modal displays with the header name "Move Sink" 
   And Resource dropdown is displayed in Move Sink modal
