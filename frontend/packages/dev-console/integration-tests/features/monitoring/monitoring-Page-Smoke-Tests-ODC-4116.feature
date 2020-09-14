Feature: Monitoring Page
    As a user, I should be able to perform actions related to monitoring a project and deployments inside it


Background: 
    Given user is at Developer perspective
    And user has a workload with name "national-parks-test"


@smoke, @regression
Scenario: Monitoring Page: MH-03-TC02
    Given user is at Topology page
    When user opens Monitoring navigation item
    Then user will see Dashboard, Metrics, Alerts, Events tabs


@smoke, @regression
Scenario: Dashboard tab on the Monitoring page for all workloads: MH-01-TC03
    Given user is on Monitoring page
    When user clicks on Dashboard tab
    Then user will see All Workloads
    And user will see the CPU Usage
    And user will see the Memory Usage
    And user will see Receive Bandwidth
    And user will see Transmit Bandwidth
    And user will see the Rate of Received Packets
    And user will see the Rate of Trasmitted Packets
    And user will see the Rate of Received Packets Dropped
    And user will see the Rate of Trasmitted Packets Dropped


@smoke, @regression
Scenario: Dashboard tab on the Monitoring page for particular workload: MH-01-TC03
    Given user is on Monitoring page
    When user clicks on Dashboard tab
    And user selects the workload from the dropdown
    Then user will see the CPU Usage
    And user will see the Memory Usage
    And user will see Receive Bandwidth
    And user will see Transmit Bandwidth
    And user will see the Rate of Received Packets
    And user will see the Rate of Trasmitted Packets
    And user will see the Rate of Received Packets Dropped
    And user will see the Rate of Trasmitted Packets Dropped


@smoke, @regression
Scenario: Events tab on the Monitoring Page: MH-01-TC05
    Given user is on Monitoring page
    When user clicks on Events tab
    Then user will see events related to all resources and all types


@smoke, @regression
Scenario: Events for Multiple Resources: MH-01-TC05
    Given user has workloads of all resource types
    And user is on Monitoring page
    When user clicks on Events tab
    And user clicks on Resources dropdown
    And user selects Service
    And user selects Deployment
    And user selects DeploymentConfig
    Then user will see events for Service, Deployment and DeploymentConfig type resources


@smoke, @regression
Scenario: Normal Types of events: MH-01-TC05
    Given user has workloads of all resource types
    And user is on Monitoring page
    When user clicks on Events tab
    And user clicks on Types dropdown
    And user selects Normal
    Then user will see normal types of events


@smoke, @regression
Scenario: Warning Types of events: MH-01-TC05
    Given user has workloads of all resource types
    And user is on Monitoring page
    When user clicks on Events tab
    And user clicks on Types dropdown
    And user selects Warning
    Then user will see warning types of events


@smoke, @regression
Scenario: Filter Events by name or message: MH-01-TC05
    Given user has workloads of all resource types
    And user is on Monitoring page
    When user clicks on Events tab
    And user enters "Scaled Up" in the Filter field
    Then user will see events having Scaled Up message
