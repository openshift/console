@topology
Feature: Sidebar in topology
              As a user, I want to check sidebar of workloads

        Background:
            Given user has created or selected namespace "aut-topology-sidebar"
              And user is at Add page


        @smoke
        Scenario: Sidebar for workload: T-14-TC01
            Given user has created workload "nodejs-ex-git" with resource type "deployment"
             When user clicks on workload "nodejs-ex-git"
             Then user can see sidebar opens with Resources tab selected by default
              And user can see sidebar Details, Resources and Monitoring tabs
              And user verifies name of the node "nodejs-ex-git" and Action drop down present on top of the sidebar
              And user is able to see health check notification
              And user can see close button


        @smoke
        Scenario: Sidebar for knative service: T-14-TC02
            Given user has created workload "hello-openshift" with resource type "Knative Service"
             When user clicks on workload "hello-openshift"
             Then user can see sidebar opens with Resources tab selected by default
              And user can see sidebar Details, Resources tabs
              And user verifies name of the node "hello-openshift" and Action drop down present on top of the sidebar
              And user can see close button


        @regression
        Scenario: Pod scale up in sidebar: T-14-TC03
            Given user has created workload "dancer-ex-git-1" with resource type "deployment"
             When user clicks on workload "dancer-ex-git-1"
              And user goes to Details tab
              And user scales up the pod
             Then user is able to see pod Scaling to "2 Pods" for workload "nodejs-ex-git-1"


        @regression
        Scenario: Pod scale down in sidebar: T-14-TC04
            Given user has created workload "nodejs-ex-git-1" with resource type "deployment"
              And user has scaled up the pod to 2 for workload "nodejs-ex-git-1"
             When user clicks on workload "nodejs-ex-git-1"
              And user goes to Details tab
              And user scales down the pod number
             Then user is able to see pod Scaling to "1 Pod" for workload "nodejs-ex-git-1"
