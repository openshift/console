Feature: Event Sources
    As a developer I want to create event sources and perfrom various actions in topology

Background:
Given developer is on project topology page

Scenario: Display the event source page by selecting the event source on node right click
   Given topology page should contain at least one node
   When developer right click on the node
   And  Hover on the Add References option from context menu
   And select the Event Source option
   Then event source page form should be displayed

Scenario: Verify the sections of the event source page
   Given topology page should contain at least one node
   When developer hovers on the node gesture
   And  select the Event Source option from the context menu
   Then event source page form should be displayed
   And verify Type, Sink, General, Advanced Options sections

Scenario: Create the event source for CronJob source type by selecting the event source option from Actions Menu
   Given topology page should contain at least one node
   When developer selects Action menu dropdown present in right hand side of the screen
   And select the Event Source from Action Menu
   And verify the event source page
   And select the “CronJob” card from type section  
   And enter “{string}” in the data field
   And enter “{string}” in the schedule field
   And select the “App Name” option from Application drop down menu of  General section  
   And verify the default value  as “CronJob” in name field
   And verify name field is editable
   And verify Resource Limits and Resource Requests links are editable
   And click on create button
   Then event source is created along with the sink connector in topology page

Scenario: Move the sink via gestures to link knative services
   Given knative service, event source and sink connector are present in topology page
   When developer selects the end point of sink connector
   And  drag onto the knative service
   Then connector should get connected to knative service
   And on hover it displays tooltip Move Sink

Scenario: Move the sink via context menu to link knative Service
   Given knative service, event source and sink connector are present in topology page
   When right click on the knative service 
   And  select the “Move Sink” from context menu
   Then modal should be displayed with the multiple new knative sink details existing/newly created knative services

Scenario: Non knative services should not display in “Move Sink” modal
   Given knative service, event source and sink connector are present in topology page
   When right click on the knative service 
   And  select the “Move Sink” from context menu
   Then modal should be displayed
   And verify the non knative services display

Scenario: Move the sink via Action menu to link knative Service
   Given knative service, event source and sink connector are present in topology page
   When Select the action menu dropdown present in right hand side of the screen
   And  select the “Move Sink” from Action menu
   Then modal should be displayed with the multiple new knative sink details



