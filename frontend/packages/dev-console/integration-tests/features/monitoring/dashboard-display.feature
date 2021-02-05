@monitoring
Feature: Monitoring Page
        As a user, I should be able to perform actions related to monitoring a project and deployments inside it

    Background:
        Given user is at developer perspective
        And user has created or selected namespace "aut-monitoring-1"


    @smoke
    Scenario: Monitoring Page: MH-01-TC01
        Given user is at Add page
        When user navigates to Monitoring page
        Then user will see Dashboard, Metrics, Alerts, Events tabs


    @regression
    Scenario: Dashboard tab on the Monitoring page for particular workload: MH-01-TC03
        Given user is at Add page
        And user has created workload "parks-test" with resource type "Deployment"
        And user opened the url of the workload "national-parks-test" in topology page
        And user is on Monitoring page
        When user clicks on "Dashboard" tab
        And user selects the workload "national-parks-test" from the dropdown
        Then user will see the CPU Usage on Dashboard tab
        And user will see the Memory Usage on Dashboard tab
        And user will see Receive Bandwidth on Dashboard tab
        And user will see Transmit Bandwidth on Dashboard tab
        And user will see the Rate of Received Packets on Dashboard tab
        And user will see the Rate of Transmitted Packets on Dashboard tab
        And user will see the Rate of Received Packets Dropped on Dashboard tab
        And user will see the Rate of Transmitted Packets Dropped on Dashboard tab


    @regression
    Scenario: Dashboard tab on the Monitoring page for all workloads: MH-01-TC02
        Given user is at Add page
        And user has created workload "national-parks-test-1" with resource type "Deployment"
        And user opened the url of the workload "national-parks-test-1" in topology page
        And user is on Monitoring page
        When user clicks on "Dashboard" tab
        Then user will see the dropdown selected with All Workloads by default
        Then user will see the CPU Usage on Dashboard tab
        And user will see the Memory Usage on Dashboard tab
        And user will see Receive Bandwidth on Dashboard tab
        And user will see Transmit Bandwidth on Dashboard tab
        And user will see the Rate of Received Packets on Dashboard tab
        And user will see the Rate of Transmitted Packets on Dashboard tab
        And user will see the Rate of Received Packets Dropped on Dashboard tab
        And user will see the Rate of Transmitted Packets Dropped on Dashboard tab


    @smoke
    Scenario: Events tab on the Monitoring Page: MH-01-TC05
        Given user is on Monitoring page
        When user clicks on "Events" tab
        Then user will see events related to all resources and all types


    @regression
    Scenario: Events for Multiple Resources: MH-01-TC06
        Given user has workloads of all resource types
        And user is on Monitoring page
        When user clicks on "Events" tab
        And user clicks on Resources dropdown
        And user selects Service
        And user selects Deployment
        And user selects DeploymentConfig
        Then user will see events for Service, Deployment and DeploymentConfig type resources


    @regression
    Scenario Outline: Event types on monitoring page: MH-01-TC07
        Given user has workloads of all resource types
        And user is on Monitoring page
        When user clicks on "Events" tab
        And user clicks on Types dropdown
        And user selects "Normal" from Types dropdown
        Then user will see normal types of events

        Examples:
        | Type    |
        | Normal  |
        | Warning |


    @regression
    Scenario: Filter Events by name or message: MH-01-TC08
        Given user has workloads of all resource types
        And user is on Monitoring page
        When user clicks on "Events" tab
        And user enters "Scaled Up" in the Filter field
        Then user will see events having Scaled Up message


    @smoke
    Scenario: Alerts tab on monitoring page: MH-01-TC04
        Given user is on Monitoring page
        When user clicks on "Alerts" tab
        Then user is able to see Name, Severity, Alert State and Notifications