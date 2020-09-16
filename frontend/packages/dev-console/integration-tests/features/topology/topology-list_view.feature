Feature: List view in topology
	As a user, I want to see list view in topology   

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-topology-list-view"


@regression, @smoke
Scenario: Topology List view : T-07-TC05
   Given user created workload "nodejs-ex-git" with resource type "Deployment" 
   When user clicks on List view button
   And user verifies the filter by resource on top
   Then user will see workloads are segregated by applications groupings

@regression
Scenario: Topology filter by resource: T-07-TC06, T-07-TC07
   Given user created two workloads with resource type "Deployment" and "Deployment-Config" 
   When user clicks on List view button
   And user clicks the filter by resource on top
   And user will see "Deployment" and "Deployment-Config" options with '1' associated with it
   And user clicks on Deployment
   And user can see only the deployment workload
   And user clicks on Deployment-Config
   Then user can see only the deployment-config workload
