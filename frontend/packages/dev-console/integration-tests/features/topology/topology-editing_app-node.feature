Feature: Editing an application
	As a user, I want to edit an application   

Background:
    Given user is in topology

@regression, @smoke
Scenario: Editing a workload : T-06-TC14, T-06-TC15
   Given user is in the topology with deployment  workload
   When user right clicks on the node 
   And user sees context menu
   And user clicks on "Edit App name"(like Edit golang)
   And user can see Edit form
   And user verifies that name of the node and route option is not editable
   And user verifies that Application grouping, git url builder image version and advanced option can be edited
   And user edits Application name
   And user clicks on save
   Then user can see the change of node to the new Application defined above

@regression
Scenario: Editing a knative service : T-06-TC14, T-06-TC15
   Given user is in the topology with knative workload
   When user right clicks on the node 
   And user sees context menu
   And user clicks on "Edit Service"
   And user can see Edit form
   And user verifies that name of service and route option is not editable
   And user verifies that Application grouping, git url builder image version and advanced option can be edited
   And user edits Application name
   And user clicks on save
   Then user can see the change of knative service to the new Application defined above