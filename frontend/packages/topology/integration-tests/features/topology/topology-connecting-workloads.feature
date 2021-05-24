@topology
Feature: Connecting nodes
              As a user, I want to connect two workloads

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-connecting-nodes"
              And user has created workload "nodejs-ex-git" with resource type "Deployment"
              And user is at Add page


        @smoke
        Scenario: Create visual connection between two nodes using Annotations : T-05-TC01, T-05-TC02
            Given user has created workload "dancer-ex-git" with resource type "Deployment Config"
             When user clicks on workload "nodejs-ex-git"
              And user clicks on Action menu
              And user clicks "Edit Annotations" from actions menu
              And user enters key as "app.openshift.io/connects-to"
              And user enters value as "dancer-ex-git" to which it will be connected
             Then user can see that two workloads are connected with arrow


        @regression @manual
        Scenario: Create visual connection between two nodes using drag and drop : T-05-TC04
            Given user has creaeted two worloads "nodejs-ex-git" and "dancer-ex-git"
             When user scrolls over a node to see the arrow
              And user click on the front of arrow and drag it on to the other node and drop it
             Then user can see the arrow connecting them with head pointing to the node where the arrow is dropped
