Feature: Topology chart area
	As a user, I want to verify topology chart visuals    

Background:
   Given user is at developer perspective
   And user has selected namespace "aut-topology-delete-workload"


@regression, @smoke
Scenario: Empty state of topology : T-01-TC01
   When user navigates to Topology page
   Then user sees Topology page with message on the top "No workloads found"


@regression, @smoke
Scenario: Topology with workloads : T-02-TC01
   Given user has created a workload named "nodejs-ex-git"
   And user has created knative workload "nodejs-ex-git-1"
   When user navigates to Topology page
   Then user sees different workloads in topology chart area


@regression, @smoke, @manual
Scenario: Visual for deployment : T-02-TC01
   Given user has created a workload named "nodejs-ex-git"
   And user is at the Topology page
   When user checks nodes and the decorators associated with them
   Then nodes are circular shaped with builder image in them
   And pod ring associated with node are present around node with color according to the pod status
   And deployment can have application url on top-right of the node 
   And user sees edit source code decorator is on bottom right of the node which can lead to github or che workspace
   And user sees build decorator on bottom left which will take user to either build tab or pipeline depending on pipeline associated with them 
   And user checks node label having "D" for deployment and then name of node


@regression, @smoke, @manual
Scenario: Visual for deployment-config : T-02-TC01
   Given user is at the Topology page
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
   Given user is at the Topology page
   And knative workload without revision is present in topology
   When user checks nodes and the decorators associated with them
   Then user can view knative service are rectangular shaped with round corners
   And user can see dotted boundary with text "No Revision" mentioned
   And knative sevice app can have application url on top-right of the node
   And user sees build decorator on bottom left on knative service app which will take user to build tab
   And user checks knative service having label "KSVC" and then the name of service


@regression, @smoke, @manual
Scenario: Visual for knative service with revisions : T-02-TC03
   Given user is at the Topology page
   And knative workload with revison is present in topology
   When user checks nodes and the decorators associated with them
   Then user can view knative service are rectangular shaped with round corners
   And user can see knative service app with dotted boundary with revision present inside it
   And knative sevice app can have application url on top-right of the node
   And user can see traffic distribution from knative sevice app to its revisions with its percentage number
   And pod ring associated with revisions are present around node with color according to the pod status
   And knative revision can have application url on top-right of the node 
   And user sees edit source code decorator is on bottom right of the revision which can lead to github or che workspace
   And user sees build decorator on bottom left on knative service app which will take user to either build tab 
   And user checks revisions having label "REV" and then the name
   And user checks knative service having label "KSVC" and then the name of service


@regression, @smoke
Scenario: Context menu of node : T-06-TC10
   Given user has created a workload named "nodejs-ex-git"
   And user is at the Topology page
   When user right clicks on the node "nodejs-ex-git" to open context menu 
   Then user is able to context menu options like Edit Application Grouping, Edit Pod Count, Pause Rollouts, Add Health Checks, Add Horizontal Pod Autoscaler, Add Storage, Edit Update Strategy, Edit Labels, Edit Annotations, Edit Deployment, Delete Deployment 


@regression, @smoke, @manual
Scenario: Zoom In in topology : T-07-TC01
   Given user has created a workload named "nodejs-ex-git"
   And user is at the Topology page
   When user clicks on Zoom In option
   Then user sees the chart area is zoomed


@regression, @smoke, @manual
Scenario: Zoom Out in topology : T-07-TC01
   Given user has created a workload named "nodejs-ex-git"
   And user is at the Topology page
   When user clicks on Zoom Out option
   Then user sees the chart area is zoomed out


@regression, @manual
Scenario: Fit to Screen in topology : T-07-TC03
   Given user has created a workload named "nodejs-ex-git"
   And user is at the Topology page
   When user clicks on Zoom In option
   And user sees the chart area is zoomed
   And user clicks on Fit to Screen option
   Then user sees the nodes fitting within chart area


@regression, @manual
Scenario: Reset view in topology: T-07-TC02
   Given user has created a workload named "nodejs-ex-git"
   And user is at the Topology page
   When user clicks on Zoom In option
   And user sees the chart area is zoomed
   And user clicks on Reset View option
   Then user sees the chart area is reset to original

@regression
Scenario: Topology filter by resource: T-07-TC06, T-07-TC07
   Given user created two workloads with resource type "Deployment" and "Deployment-Config" 
   When user is at Topology page chart view
   And user clicks the filter by resource on top
   And user will see "Deployment" and "Deployment-Config" options with '1' associated with it
   And user clicks on Deployment
   And user can see only the deployment workload
   And user clicks on Deployment-Config
   Then user can see only the deployment-config workload
