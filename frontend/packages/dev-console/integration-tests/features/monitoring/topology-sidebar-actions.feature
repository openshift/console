@monitoring
Feature: Observe tab on the topology Sidebar
              As a user, I should be able to see Observe tab on the sidebar of topology page and add Health Checks


        Background:
            Given user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-observe-sidebar"


        @smoke
        Scenario Outline: Navigating to Observe page from topology page Sidebar for "<resourceType>" workload : M-04-TC01
            Given user has created workload "<workload>" with resource type "<resourceType>"
              And user is at Topology page
             When user clicks on the workload "<workload>" to open the sidebar
              And user clicks on Observe tab
              And user clicks on View dashboard link
             Then page redirected to the Dashboard tab of Observe page
              And user will see the "Kubernetes / Compute Resources / Workload" selected in the Dashboard dropdown
              And user user will see "<workload>" option selected in the Workload dropdown
              And user selects "<resourceType>" option selected in the Type dropdown

        Examples:
                  | workload      | resourceType      |
                  | parks-test-d  | Deployment        |
                  | parks-test-dc | Deployment Config |


        @smoke
        Scenario: Observe tab on the Sidebar for Helm Release: M-04-TC02
            Given helm release "nodejs" is present in topology page
             When user clicks on the workload "nodejs" to open the sidebar
              And user clicks on Observe tab
              And user clicks on View dashboard link
             Then page redirected to the Observe page


        @regression
        Scenario: Observe tab on the Sidebar for Knative Service: M-04-TC03
            Given workload "parks-test-kn" with resource type "Knative Service" is present in topology page
              And user is at the Topology page
             When user clicks on the knative service "nodejs-ex-git-app" to open the sidebar
             Then user wont see Observe tab


        @regression @to-do
        Scenario: Navigating to Observe Metrics from the workload Sidebar: M-04-TC04
            Given Deployment "nodejs-ex-git" is present in topology page
             When user clicks on the workload "nodejs-ex-git" to open the sidebar
              And user clicks on Observe tab
              And user clicks on Memory usage chart
             Then page redirected to the Observe Metrics page for the chart
