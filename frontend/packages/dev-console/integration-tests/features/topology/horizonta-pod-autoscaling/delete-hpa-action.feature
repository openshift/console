Feature: Delete HPA action
	As a user, I want to remove the HPA assigned to a workload
 
Background:
    Given user is in developer perspective
    And user has created a deployment 
    And user has added CPU resource limit
    And user has added Memory resource limit
    And user is in topology

@regression
Scenario: Remove HPA 
   Given user has a workload "nodejs-ex-git-1" with HPA assigned to it
   When user opens sidebar of workload
   And user opens action menu
   And user clicks on Remove Horizontal Pod Autoscaler option 
   And user sees Remove Horizontal Pod Autoscaler modal opens
   And user sees Remove and Cancel option
   And user clicks Remove
   Then user can see HPA section gets removed

@regression
Scenario: Delete HPA from Administrative perspective
   Given user has a workload "nodejs-ex-git-1" with HPA assigned to it
   When user switches to administrative perspective
   And user goes to Workloads
   And user selects Horizontal Pod Autoscalers option 
   And user opens the HPA associated with the workload
   And user sees the HPA details page
   And user opens action menu
   And user clicks on Delete Horizontal Pod Autoscaler option 
   And user sees Delete Horizontal Pod Autoscaler modal opens
   And user sees Delete and Cancel option
   And user clicks Delete
   Then user can see the intended HPA is deleted
