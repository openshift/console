Feature: Event Sources actions
    As a user, I want to perform actions on event sources

Background:
   Given user has installed Openshift Serverless operator
   And user is at developer perspecitve
   And user has selected namespace "aut-knative-event-source-actions"
   And user has created knative service "nodejs-ex-git-1"
   And user has created "sink-binding" event source


@regression, @smoke
Scenario: Side bar for event source: Kn-12-TC01
   Given knative service, event source and sink connector are present in topology page
   When user clicks on event source "Sink Binding" to open side bar
   Then user can see side bar with header name "Sink Binding"


@regression, @smoke
Scenario: Move the sink via Action menu to link knative Service : Kn-12-TC02
   Given knative service, event source and sink connector are present in topology page
   When user clicks on event source "Sink Binding" to open side bar
   And user selects "Move Sink" from side bar Action menu
   Then modal displays with the header name "Move Sink" 
   And Resource dropdown is displayed in Move Sink modal
