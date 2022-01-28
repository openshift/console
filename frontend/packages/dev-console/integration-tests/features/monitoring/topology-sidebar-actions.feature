@monitoring
Feature: Observe tab on the topology Sidebar
              As a user, I should be able to see Observe tab on the sidebar of topology page and add Health Checks


        Background:
            Given user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-observe-sidebar"


        @smoke @odc-3698
        Scenario Outline: Navigating to Observe page from topology page Sidebar for "<resourceType>" workload : M-04-TC01
            Given user has created workload "<workload>" with resource type "<resourceType>"
              And user is at Topology page
             When user clicks on the workload "<workload>" to open the sidebar
              And user clicks on Observe tab
              And user clicks on View dashboard link
             Then page redirected to the Dashboard tab of Observe page
              And user will see the "Kubernetes / Compute Resources / Workload" selected in the Dashboard dropdown
              And user will see "<workload>" option selected in the Workload dropdown
              And user will see "<resourceType>" option selected in the Type dropdown

        Examples:
                  | workload      | resourceType      |
                  | parks-test-d  | deployment        |


        @smoke @odc-3698
        Scenario: Observe tab on the Sidebar for Helm Release: M-04-TC02
            Given helm release "nodejs" is present in topology page
             When user clicks on the deployment of workload "nodejs" to open the sidebar
              And user clicks on Observe tab
              And user clicks on View dashboard link
             Then page redirected to the Observe page


        @regression
        Scenario: Observe tab on the Sidebar for Knative Service: M-04-TC03
            Given user has installed OpenShift Serverless Operator
              And user is at Add page
              And workload "parks-test-kn" with resource type "Knative Service" is present in topology page
              And user is at the Topology page
             When user clicks on the knative service "parks-test-kn" to open the sidebar
             Then user wont see Observe tab


        @regression @odc-3698
        Scenario: Navigating to Observe Metrics from the workload Sidebar: M-04-TC04
            Given workload "nodejs-ex-1" with resource type "Deployment" is present in topology page
             When user clicks on the workload "nodejs-ex-1" to open the sidebar
              And user clicks on Observe tab
              And user clicks on Memory usage chart
             Then page redirected to the Observe Metrics page for the chart