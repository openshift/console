Feature: List view in topology
	As a user, I want to see list view in topology   

@regression, @smoke
Scenario: Checking List view in topology : T-07-TC05
   Given user is in topology
   And topology has workloads
   When user clicks on List view button
   And user verifies the "Group by" filter on top
   Then user sees nodes are present divided by applications groupings
