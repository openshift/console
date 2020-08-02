Feature: Deleteing an application node
	As a user, I want to delete an application   

Background:
    Given user is in topology

@regression
Scenario: Deleting a workload through Action menu : T-09-TC01
   Given topology has workloads
   When user clicks on workload to open sidebar
   And user clicks on Action menu
   And user clicks delete workload(deployment, deployment-config etc.)
   And user sees "Delete" modal box to open
   And user checks "Delete dependent objects of this resource" to be checked
   And user clicks on "Delete"
   Then user sees the workload disappeared from topology

@regression, @smoke
Scenario: Deleting a workload through context menu : T-06-TC16
   Given topology has different workloads
   When user right clicks on the node 
   And user checks delete option in the menu
   And user clicks delete workload(deployment, deployment-config etc.)
   And user sees "Delete" modal box to open
   And user checks "Delete dependent objects of this resource" to be checked
   And user clicks on "Delete"
   Then user sees the workload disappeared from topology