@monitoring
Feature: Monitoring tab on the topology Sidebar
              As a user, I should be able to see Monitoring tab on the sidebar of topology page and add Health Checks


        Background:
            Given user is at developer perspective
              And user is at Add page
              And user has created or selected namespace "aut-monitoring-sidebar"


        @smoke
        Scenario Outline: Navigating to Monitoring page from topology page Sidebar for "<resourceType>" workload : M-04-TC01
            Given workload "<workload>" with resource type "<resourceType>" is present in topology page
             When user clicks on the workload "<workload>" to open the sidebar
              And user clicks on Monitoring tab
              And user clicks on View Monitoring dashboard link
             Then page redirected to the Monitoring page
              And user will see CPU Usage Metrics
              And user will see Memory Usage Metrics
              And user will see Receive Bandwidth Metrics
              And user will see All Events dropdown

        Examples:
                  | workload      | resourceType      |
                  | parks-test-d  | Deployment        |
                  | parks-test-dc | Deployment Config |


        @smoke
        Scenario: Monitoring tab on the Sidebar for Helm Release: M-04-TC02
            Given helm release "nodejs-ex-k" is present in topology page
             When user clicks on the workload "node-js-ex" to open the sidebar
              And user clicks on Monitoring tab
              And user clicks on View Monitoring dashboard link
             Then page redirected to the Monitoring page


        @regression
        Scenario: Monitoring tab on the Sidebar for Knative Service: M-04-TC03
            Given workload "parks-test-kn" with resource type "Knative Service" is present in topology page
              And user is at the Topology page
             When user clicks on the knative service "nodejs-ex-git-app" to open the sidebar
             Then user wont see Monitoring tab


        @regression @to-do
        Scenario: Navigating to Monitoring Metrics from the workload Sidebar: M-04-TC04
            Given Deployment "nodejs-ex-git" is present in topology page
             When user clicks on the workload "nodejs-ex-git" to open the sidebar
              And user clicks on Monitoring tab
              And user clicks on Memory usage chart
             Then page redirected to the Monitoring Metrics page for the chart
