@topology
Feature: Topology Layout should be saved
              As a user, working in the topology, the graphical layout should be remembered for each project


        Background:
            Given user is at the topology page
              And user has selected namespace "aut-topology-layout-save"
              And user has created workload "hello-openshift"
              And user logs in with kubeadmin credentials


        @manual
        Scenario: Topology Graph View persistence: T-11-TC01
            Given user has selected Graph View
             When user navigates to add page
              And user navigates to topology page
             Then user will see topology Graph view


        @manual
        Scenario: Topology List View persistence: T-11-TC02
            Given user has selected List View
             When user logs out from cluster
              And user logs in to cluster with kubeadmin credentials
             Then user will see topology view unchanged


        @manual
        Scenario: Topology Layout 1 persistence: T-11-TC03
            Given user has selected Layout 1
             When user navigates to add page
              And user navigates to topology page
             Then user will see topology Layout 1 unchanged


        @manual
        Scenario: Topology Layout 2 persistence: T-11-TC04
            Given user has selected Layout 2
             When user logs out from cluster
              And user logs in to cluster with kubeadmin credentials
              And user navigates to topology page
             Then user will see topology Layout 2 unchanged


        @manual
        Scenario: Persistence Topology Layout across page views: T-11-TC05
            Given user has created workload "hello-openshift"
              And user kept workload on right top corner
              And user has selected Layout 2 in Graph View
              And user has zoomed in the topology to a certain amount
             When user navigates to add page
              And user navigates to topology page
             Then user will see topology page unchanged
              And user will see node location unchanged
              And user will see zoom level unchanged


        @manual
        Scenario: Persistence Topology Layout after logging out from cluster: T-11-TC06
            Given user has created workload "hello-openshift"
              And user kept workload on right top corner
              And user has selected Layout 2 in Graph View
             When user logs out from cluster
              And user logs in to cluster with kubeadmin credentials
              And user navigates to topology page
             Then user will see topology page unchanged
              And user will see node location unchanged
