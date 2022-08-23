@topology
Feature: Sidebar in topology
              As a user, I want to check sidebar of workloads

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-sidebar"
              And user is at Add page


        @smoke
        Scenario: Sidebar for workload: T-14-TC01
            Given user has created workload "nodejs-ex-git" with resource type "deployment"
             When user clicks on workload "nodejs-ex-git"
             Then user can see sidebar opens with Resources tab selected by default
              And user can see sidebar Details, Resources and Observe tabs
              And user verifies name of the node "nodejs-ex-git" and Action drop down present on top of the sidebar
              And user is able to see health check notification
              And user can see close button


        @smoke
        Scenario: Sidebar for knative service: T-14-TC02
            Given user has installed OpenShift Serverless Operator
              And user is at developer perspective
              And user has selected namespace "aut-topology-sidebar"
              And user is at Add page
              And user has created workload "hello-openshift" with resource type "Knative Service"
             When user clicks on knative workload "hello-openshift"
             Then user can see sidebar opens with Resources tab selected by default
              And user can see sidebar Details, Resources tabs
              And user verifies name of the node "hello-openshift" and Action drop down present on top of the sidebar
              And user can see close button


        @regression
        Scenario: Pod scale up in sidebar: T-14-TC03
            Given user has created workload "nodejs-ex-git-1" with resource type "deployment"
             When user clicks on workload "nodejs-ex-git-1"
              And user goes to Details tab
              And user can see pod count is 1
              And user scales up the pod
             Then user is able to see pod Scaling to "2Pods" for workload "nodejs-ex-git-1"


        @regression
        Scenario: Pod scale down in sidebar: T-14-TC04
            Given user can see workload "nodejs-ex-git-1" is created
             When user clicks on workload "nodejs-ex-git-1"
              And user opens Details tab
              And user scales down the pod number
             Then user is able to see pod Scaling to "1Pod" for workload "nodejs-ex-git-1"


        @regression @odc-6361 @manual
        Scenario: Resize the workload sidebar: T-14-TC05
            Given user has created workload "nodejs-ex-git-1" with resource type "deployment"
             When user clicks on workload "nodejs-ex-git-1"
              And user drags the sidebar from the edge
             Then user is able to resize the sidebar


        @regression @odc-6361
        Scenario: Change the route url with annotation: T-14-TC06
            Given user has created a deployment workload "nodejs-ex-2"
              And user is at Topology chart view
             When user clicks on workload "nodejs-ex-2" to open sidebar
              And user clicks on Action menu
              And user clicks on "Edit annotations" from action menu
              And user enters key as "app.openshift.io/route-url"
              And user enters value as "https://openshift.com"
             Then user can see the new route href in route decorator be "https://openshift.com"


        @regression @odc-6361
        Scenario: Removing route through annotations: T-14-TC07
            Given user has created a deployment workload "nodejs-ex-3"
              And user is at Topology chart view
             When user clicks on workload "nodejs-ex-3" to open sidebar
              And user clicks on Action menu
              And user clicks on "Edit annotations" from action menu
              And user deletes the existing annotation for route
              And user enters key as "app.openshift.io/route-disabled"
              And user enters value as "true"
             Then user can see route decorator has been hidden for workload "nodejs-ex-3"
