Feature: Deleteing an application node
	As a user, I want to delete an application   

Background:
   Given user is at Topology page
   And open project namespace "aut-topology-delete-workload"

@regression
Scenario: Deleting a workload through Action menu : T-09-TC01
   Given topology has workloads
   When user clicks on workload to open sidebar
   And user clicks on Action menu
   And user clicks delete workload
   And user sees "Delete" modal box to open
   And user checks Delete dependent objects of this resource to be checked
   And user clicks on "Delete"
   Then workload "nodejs-ex-git" disappeared from topology


@regression, @smoke
Scenario: Deleting a workload through context menu : T-06-TC16
   Given git workload "nodejs-ex-git" with resource type "Deployment" 
   When user right clicks on the node "nodejs-ex-git"
   And user selects "Delete Deployment" from the context menu
   And user sees "Delete" modal box to open
   And user checks Delete dependent objects of this resource to be checked
   And user clicks on "Delete"
   Then workload "nodejs-ex-git" disappeared from topology