Feature: Add HPA action and topology sidebar modifications
	As a user, I want to add a HPA to a workload
 
Background:
    Given user is in developer perspective
    And user has created a deployment/deployment-config 
    And user has assigned values to cpu and memory value in resource limit section of advanced option
    And user has a workload with HPA assigned to it

@regression @manual
Scenario: Changes due to HPA in Workload Sidebar
   Given user is in topology
   When user opens sidebar of workload
   And user selects on resource tab
   And user sees Horizontal Pod Autoscalers section
   And user opens action menu
   And user does not see Edit Pod Count option 
   And user clicks on details tab
   Then user can see the scaling of the pod disabled
   And user can see the arrows to increase and decrease pods are not present
   And user can see the pod value inside the pod donut
