@topology
Feature: Sidebar in topology
              As a user, I want to check sidebar of workloads

        Background:
            Given user is at developer perspective
              And user has selected namespace "aut-topology-sidebar"


        @smoke
        Scenario Outline: Sidebar for workload: T-05-TC01
            Given user created workload "<workload_name>" with resource type "<resource_type>"
             When user clicks on workload "<workload_name>"
             Then user can see sidebar opens with Resources tab selected by default
              And user can see sidebar Details, Resources and Monitoring tabs
              And user verifies name of the node "<workload_name>" and Action drop down present on top of the sidebar
              And user is able to see health check notifiation
              And user can see close button

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git   |
                  | deployment config | dancer-ex-git-1 |


        @smoke
        Scenario: Sidebar for knative service: T-05-TC01
            Given user created workload "hello-openshift" with resource type "knative service"
             When user clicks on workload "hello-openshift"
             Then user can see sidebar opens with Resources tab selected by default
              And user can see sidebar Details, Resources tabs
              And user verifies name of the node "hello-openshift" and Action drop down present on top of the sidebar
              And user can see close button


        @regression
        Scenario Outline: Pod scale up in sidebar
            Given user created workload "<workload_name>" with resource type "<resource_type>"
             When user clicks on workload "<workload_name>"
              And user goes to Details tab
              And user scales up the pod
             Then user is able to see pod Scaling to 2
              And user can see two half circles in light and dark blue representing two pods

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git   |
                  | deployment config | dancer-ex-git-1 |


        @regression
        Scenario Outline: Pod scale down in sidebar
            Given user created workload "<workload_name>" with resource type "<resource_type>"
              And user has scaled up the pod to 2
             When user clicks on workload "<workload_name>"
              And user goes to Details tab
              And user scales down the pod number
             Then user is able to see pod number change to 1
              And user can see two half circles appearing and changing to one

        Examples:
                  | resource_type     | workload_name   |
                  | deployment        | nodejs-ex-git   |
                  | deployment config | dancer-ex-git-1 |
