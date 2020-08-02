Feature: Connecting nodes
	As a user, I want to connect two application   

Background:
    Given user is in topology

@regression, @smoke
Scenario: Create visual connection between two nodes using Annotations : T-05-TC01, T-05-TC02
   Given topology has atleast two nodes
   When user opens sidebar of one of the node
   And user opens action menu and selects "Edit Annotations" option
   And user enters key as "app.openshift.io/connects-to"
   And user enters value as name of the node to which it will be associated
   Then user can see the arrow connecting them with head pointing to the node whose value is provided in the "Edit Annotations"

@regression, @smoke, @manual
Scenario: Create visual connection between two nodes using drag and drop : T-05-TC04
   Given topology has atleast two nodes
   When user scrolls over a node to see the arrow
   And user click on the front of arrow and drag it on to the other node and drop it
   Then user can see the arrow connecting them with head pointing to the node where the arrow is dropped
