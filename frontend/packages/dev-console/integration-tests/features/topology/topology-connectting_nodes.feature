Feature: Connecting nodes
	As a user, I want to connect two application   

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-topology-connecting-nodes"


@regression, @smoke
Scenario: Create visual connection between two nodes using Annotations : T-05-TC01, T-05-TC02
   Given user has creaeted two worloads "nodejs-ex-git" and "dancer-ex-git"
   And user is at the Topolgy page
   When user clicks node "nodejs-ex-git" to open the side bar
   And user selects "Edit Annotations" option from Actions menu
   And user enters key as "app.openshift.io/connects-to"
   And user enters value as name of the node "dancer-ex-git" to which it will be associated
   Then user can see that two nodes are connected with dotted arrow


@regression, @smoke, @manual
Scenario: Create visual connection between two nodes using drag and drop : T-05-TC04
   Given user has creaeted two worloads "nodejs-ex-git" and "dancer-ex-git"
   When user scrolls over a node to see the arrow
   And user click on the front of arrow and drag it on to the other node and drop it
   Then user can see the arrow connecting them with head pointing to the node where the arrow is dropped
