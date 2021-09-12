@monitoring
Feature: Observe Page
              As a user, I should be able to perform actions related to observe a project and deployments inside it


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-observe-1"


        @smoke
        Scenario: Observe Page: M-02-TC01
            Given user is at Add page
             When user navigates to Observe page
             Then user will see Dashboard, Metrics, Alerts, Events tabs


        @regression
        Scenario: Dashboard tab on the Observe page with Kubernetes / Compute Resources / Namespace (Workloads) option selected: M-02-TC02
            Given user has created workload "parks-test" with resource type "Deployment"
              And user is on Observe page
             When user clicks on "Dashboard" tab
              And user clicks on Dashboard dropdown
              And user clicks on "Kubernetes / Compute Resources / Namespace (Workloads)" option
              And user clicks on Type dropdown
              And user selects "deployment" option from the dropdown
             Then user will see "CPU Usage" chart
              And user will see "CPU Quota" chart
              And user will see "Memory Usage" chart
              And user will see "Memory Quota" chart
              And user will see "Current Network Usage" chart
              And user will see "Bandwidth" charts
              And user will see "Rate of Packets" charts
              And user will see "Rate of Packets Dropped" charts


        @regression
        Scenario: Dashboard tab on the Observe page with Kubernetes / Compute Resources / Namespace (Pods) option selected: M-02-TC03
            Given user is on Observe page
             When user clicks on "Dashboard" tab
              And user clicks on Dashboard dropdown
              And user clicks on "Kubernetes / Compute Resources / Namespace (Pods)" option
             Then user will see "CPU Utilisation (from requests)" chart
              And user will see "CPU Utilisation (from limits)" chart
              And user will see "Memory Utilisation (from requests)" chart
              And user will see "Memory Utilisation (from limits)" chart
              And user will see "CPU Usage" chart
              And user will see "CPU Quota" chart
              And user will see "Memory Usage" chart
              And user will see "Memory Quota" chart
              And user will see "Current Network Usage" chart
              And user will see "Bandwidth" charts
              And user will see "Rate of Packets" charts
              And user will see "Rate of Packets Dropped" charts
              And user will see "Storage IO" charts
              And user will see "Storage IO - Distribution" chart


        @regression
        Scenario: Dashboard tab on the Observe page with Kubernetes / Compute Resources / Workload option selected: M-02-TC04
            Given user is on Observe page
             When user clicks on "Dashboard" tab
              And user clicks on Dashboard dropdown
              And user clicks on "Kubernetes / Compute Resources / Workload" option
              And user clicks on Workload dropdown
              And user selects "parks-test" option from the dropdown
              And user clicks on Type dropdown
              And user selects "deployment" option from the dropdown
             Then user will see "CPU Usage" chart
              And user will see "CPU Quota" chart
              And user will see "Memory Usage" chart
              And user will see "Memory Quota" chart
              And user will see "Current Network Usage" chart
              And user will see "Bandwidth" charts
              And user will see "Average Container Bandwidth by Pod" charts
              And user will see "Rate of Packets" charts
              And user will see "Rate of Packets Dropped" charts


        @regression
        Scenario: Dashboard tab on the Observe page with Kubernetes / Compute Resources / Pods option selected: M-02-TC05
            Given user is on Observe page
             When user clicks on "Dashboard" tab
              And user clicks on Dashboard dropdown
              And user clicks on "Kubernetes / Compute Resources / Pods" option
              And user clicks on Pod dropdown
              # Pod name is dynamic so select first option
              And user selects first option
             Then user will see "CPU Usage" chart
              And user will see "CPU Throttling" chart
              And user will see "CPU Quota" chart
              And user will see "Memory Usage" chart
              And user will see "Memory Quota" chart
              And user will see "Bandwidth" charts
              And user will see "Rate of Packets" charts
              And user will see "Rate of Packets Dropped" charts
              And user will see "Storage IO- Distribution(Pod - Read & Writes)" charts
              And user will see "Storage IO - Distribution(Containers)" charts
              And user will see "Storage IO - Distribution" chart


        @regression
        Scenario: Inspect chart directs to Metrics tab: M-02-TC06
            Given user is on Observe page
             When user clicks on "Dashboard" tab
              And user clicks on Dashboard dropdown
              And user clicks on "Kubernetes / Compute Resources / Namespace (Pods)" option
              And user clicks on Inspect on "CPU Usage" chart
             Then Then user will see Metrics tab in Observe page
              And "CPU Usage" option selected by default


        @smoke
        Scenario: Events tab on the Observe Page: M-02-TC07
            Given user is on Observe page
             When user clicks on "Events" tab
             Then user will see events related to all resources and all types


        @regression
        Scenario: Events for Multiple Resources: M-02-TC08
            Given user has workloads of all resource types
              And user is on Observe page
             When user clicks on "Events" tab
              And user clicks on Resources dropdown
              And user selects Service
              And user selects Deployment
              And user selects DeploymentConfig
             Then user will see events for Service, Deployment and DeploymentConfig type resources


        @regression
        Scenario Outline: Event types on observe page: M-02-TC09
            Given user has workloads of all resource types
              And user is on Observe page
             When user clicks on "Events" tab
              And user clicks on Types dropdown
              And user selects "<Type>" from Types dropdown
             Then user will see normal types of events

        Examples:
                  | Type    |
                  | Normal  |
                  | Warning |


        @regression
        Scenario: Filter Events by name or message: M-02-TC10
            Given user has workloads of all resource types
              And user is on Observe page
             When user clicks on "Events" tab
              And user enters "Scaled Up" in the Filter field
             Then user will see events having Scaled Up message


        @smoke
        Scenario: Alerts tab on observe page: M-02-TC11
            Given user is on Observe page
             When user clicks on "Alerts" tab
             Then user is able to see Name, Severity, Alert State and Notifications
