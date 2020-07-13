Feature: Topology chart area
	As a user, I want to verify topology chart visuals    

@regression, @smoke
Scenario: Empty state of topology : T-01-TC01
   Given user is in administrative perspective
   When user goes to developer perspective
   And user creates a new project
   Then user sees Add page with message on the top "No workloads found"

@regression, @smoke
Scenario: Topology with workloads : T-02-TC01
   Given user is in administrative perspective
   When user switches to developer perspective
   And user selects a existing project from project list with existing workloads
   Then user sees different workloads in topology chart area

@regression, @smoke, @manual
Scenario: Visual for deployment : T-02-TC01
   Given user is in topology
   And deployment workload is present in topology
   When user checks nodes and the decorators associated with them
   Then nodes are circular shaped with builder image in them
   And pod ring associated with node are present around node with color according to the pod status
   And deployment can have application url on top-right of the node 
   And user sees edit source code decorator is on bottom right of the node which can lead to github or che workspace
   And user sees build decorator on bottom left which will take user to either build tab or pipeline depending on pipeline associated with them 
   And user checks node label having "D" for deployment and then name of node

@regression, @smoke, @manual
Scenario: Visual for deployment-config : T-02-TC01
   Given user is in topology
   And deployment-config workload is present in topology
   When user checks nodes and the decorators associated with them
   Then nodes are circular shaped with builder image in them
   And pod ring associated with node are present around node with color according to the pod status
   And deployment-config can have application url on top-right of the node 
   And user sees edit source code decorator is on bottom right of the node which can lead to github or che workspace
   And user sees build decorator on bottom left which will take user to either build tab or pipeline depending on pipeline associated with them 
   And user checks node label having "DC" for deployment-config and then name of node

@regression, @smoke, @manual
Scenario: Visual for knative service with no revision : T-02-TC03
   Given user is in topology
   And knative workload without revision is present in topology
   When user checks nodes and the decorators associated with them
   Then user can view knative service are rectangular shaped with round corners
   And user can see dotted boundary with text "No Revision" mentioned
   And knative sevice app can have application url on top-right of the node
   And user sees build decorator on bottom left on knative service app which will take user to build tab
   And user checks knative service having label "KSVC" and then the name of service

@regression, @smoke, @manual
Scenario: Visual for knative service with revisions : T-02-TC03
   Given user is in topology
   And knative workload with revison is present in topology
   When user checks nodes and the decorators associated with them
   Then user can view knative service are rectangular shaped with round corners
   And user can see knative service app with dotted boundary with revision present inside it
   And knative sevice app can have application url on top-right of the node
   And user can see traffic distribution from knative sevice app to its revisions with it's percentage number
   And pod ring associated with revisions are present around node with color according to the pod status
   And knative revision can have application url on top-right of the node 
   And user sees edit source code decorator is on bottom right of the revision which can lead to github or che workspace
   And user sees build decorator on bottom left on knative service app which will take user to either build tab 
   And user checks revisions having label "REV" and then the name
   And user checks knative service having label "KSVC" and then the name of service


@regression, @smoke
Scenario: Context menu of nodes : T-06-TC10
   Given user is in the topology
   And topology has workloads
   When user right clicks on the node 
   Then user sees context menu

@regression, @smoke, @manual
Scenario: Zoom In in topology : T-07-TC01
   Given user is in topology
   And topology has workloads
   When user clicks on Zoom In option
   Then user sees the chart area is zoomed

@regression, @smoke, @manual
Scenario: Zoom Out in topology : T-07-TC01
   Given user is in topology
   And topology has workloads
   When user clicks on Zoom Out option
   Then user sees the chart area is zoomed out

@regression, @manual
Scenario: Fit to Screen in topology : T-07-TC03
   Given user is in topology
   And topology has workloads
   When user clicks on Zoom In option
   And user sees the chart area is zoomed
   And user clicks on Fit to Screen option
   Then user sees the nodes fitting within chart area

@regression, @manual
Scenario: Reset view in topology: T-07-TC02
   Given user is in topology
   And topology has workloads
   When user clicks on Zoom In option
   And user sees the chart area is zoomed
   And user clicks on Reset View option
   Then user sees the chart area is reset to original
