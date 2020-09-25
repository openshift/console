Feature: Metrics Tab on Monitoring Page
    As a user, I should be able to run queries to check the usage


Background: 
    Given user is at Developer perspective
    And user is on "test-monitoring" namespace
    And user is on Monitoring page


@smoke, @regression
Scenario: CPU Usage Query on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "CPU Usage Query" from Select Query dropdown
    Then user will see the CPU Usage
    And user will see the pods list 
    And user will see the value of CPU used by each pod


@smoke, @regression
Scenario: Memory Usage Query on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "Memory Usage" Query from Select Query dropdown
    Then user will see the Memory Usage
    And user will see the pods list
    And user will see the value of Memory used by each pod

 
@smoke, @regression
Scenario: Filesystem Usage Query on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "Filesystem Usage" Query from Select Query dropdown
    Then user will see the Filesystem Usage
    And user will see namespace name "test-monitoring" 
    And user will see the pods list
    And user will see the value of Filesystem used by each pod


@smoke, @regression
Scenario: Receive Bandwidth Query on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "Receive Bandwidth" Query from Select Query dropdown
    Then user will see the Received Bandwidth
    And user will see the pods list
    And user will see the value of Received Bandwidth by each pod

 
@smoke, @regression
Scenario: Transmit Bandwidth Query on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "Transmit Bandwidth" Query from Select Query dropdown
    Then user will see the Transmitted Bandwidth
    And user will see the pods list
    And user will see the value of Trasmitted Bandwidth by each pod


@smoke, @regression
Scenario: Rate of Received Packets Query on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "Received Packets" Query from  Select Query dropdown
    Then user will see the Received Packets
    And user will see the pods list
    And user will see the value of Received Packets by each pod

 
@smoke, @regression
Scenario: Rate of Trasmitted Packets Query on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "Trasmitted Packets" Query from Select Query dropdown
    Then user will see the Trasmitted Packets
    And user will see the pods list
    And user will see the value of Trasmitted Packets by each pod

 
@smoke, @regression
Scenario: Rate of Received Packets Dropped Query on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "Received Packets Dropped" Query from Select Query dropdown
    Then user will see the Received Packets Dropped
    And user will see the pods list
    And user will see the value of Received Packets Dropped by each pod

 
@smoke, @regression
Scenario: Rate of Trasmitted Packets Dropped Query on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "Trasmitted Packets Dropped" Query from Select Query dropdown
    Then user will see the Trasmitted Packets Dropped
    And user will see the pods list
    And user will see the value of Trasmitted Packets Dropped by each pod


#Custom Query: "sum(container_memory_working_set_bytes{ namespace="openshift-monitoring", container!="POD", container!=""}) by (pod)"
@smoke, @regression
Scenario: Custom Query on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "Custom Query" from Select Query dropdown
    And user enters the custom query
    Then user will see the output of the custom query
    And user will see the pods list
    And user will see the value of given custom query by each pod

 
@smoke, @regression
Scenario: Show PromQL button on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "CPU Usage Query" from Select Query dropdown
    And user clicks on Show PromQL button
    Then user will see the query ran to see CPU Usage
    And user will see Hide PromQL button


@smoke, @regression
Scenario: Hide PromQL button on Metrics tab: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "CPU Usage Query" from Select Query dropdown
    And user clicks on Show PromQL button
    And user clicks on Hide PromQL button
    Then user won't see the query


@smoke, @regression
Scenario: Time range dropdown: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "CPU Usage Query" from Select Query dropdown
    And user clicks on Time range dropdown
    And user selects 1h Time
    Then user will see CPU Usage for past one hour


@smoke, @regression
Scenario: Reset Zoom button: MH-01-TC04
    Given user is on Metrics tab 
    When user selects "CPU Usage Query" from Select Query dropdown
    And user clicks on Time range dropdown
    And user selects 1h Time
    And user clicks on Reset Zoom button
    Then user will see Time range changed to 30m
 