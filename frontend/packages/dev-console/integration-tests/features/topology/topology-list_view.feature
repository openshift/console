Feature: List view in topology
	As a user, I want to see list view in topology   

Background:
    Given user is at Topology page
    And open project namespace "aut-topology-list-view"


@regression, @smoke
Scenario: Topology List view : T-07-TC05
   Given git workload "<workload_name>" with resource type "Deployment" 
   When user clicks on List view button
   And user verifies the Group by filter on top
   Then user sees nodes are present divided by applications groupings
