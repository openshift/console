Feature: Editing an application
	As a user, I want to edit an application   

Background:
   Given user is at developer perspecitve
   And user has selected namespace "aut-topology-editing-app-node"


@regression, @smoke
Scenario: Editing a workload : T-06-TC14, T-06-TC15
   Given user has created workload "nodejs-ex-git"
   And user is at the Topolgy page
   When user right clicks on the node "nodejs-ex-git" to open context menu
   And user selects option "Edit nodejs-ex-git" from context menu
   And user can see Edit form
   And user verifies that name of the node and route option is not editable
   And user verifies that Application grouping, git url, builder image version and advanced option can be edited
   And user edits Application name as "nodejs-ex-git-app-1"
   And user clicks on save
   Then user can see the change of node to the new Application "nodejs-ex-git-app-1"


@regression
Scenario: Editing a knative service : T-06-TC14, T-06-TC15
   Given user has created knative workload "nodejs-ex-git"
   And user is at the Topolgy page
   When user right clicks on the node "nodejs-ex-git" to open context menu
   And user selects option "Edit Service" from context menu
   And user can see Edit form
   And user verifies that name of service and route option is not editable
   And user verifies that Application grouping, git url, builder image version and advanced option can be edited
   And user edits Application name as "nodejs-ex-git-app-1"
   And user clicks on save
   Then user can see the change of knative service to the new Application defined above
   