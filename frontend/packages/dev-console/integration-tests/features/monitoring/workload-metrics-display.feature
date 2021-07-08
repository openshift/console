@monitoring
Feature: Metrics Tab on Monitoring Page
              As a user, I should be able to run queries to check the usage

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-monitoring-m"
              And user has opened application "dancer-ex-git" in topology page
              And user is on Monitoring page


        @smoke
        Scenario: CPU Usage Query on Metrics tab: M-06-TC01
            Given user is on Metrics tab
             When user selects "CPU usage" Query from Select Query dropdown
             Then user will see the CPU Usage on Metrics tab
              And user will see the pods list
              And user will see the value of CPU used by each pod


        @smoke
        Scenario: Memory Usage Query on Metrics tab: M-06-TC02
            Given user is on Metrics tab
             When user selects "Memory usage" Query from Select Query dropdown
             Then user will see the Memory Usage on Metrics tab
              And user will see the pods list
              And user will see the value of Memory used by each pod


        @smoke
        Scenario: Filesystem Usage Query on Metrics tab: M-06-TC03
            Given user is on Metrics tab
             When user selects "Filesystem usage" Query from Select Query dropdown
             Then user will see the Filesystem Usage on Metrics tab
              And user will see namespace name "test-monitoring"
              And user will see the pods list
              And user will see the value of Filesystem used by each pod


        @smoke
        Scenario: Receive Bandwidth Query on Metrics tab: M-06-TC04
            Given user is on Metrics tab
             When user selects "Receive bandwidth" Query from Select Query dropdown
             Then user will see the Received Bandwidth on Metrics tab
              And user will see the pods list
              And user will see the value of Received Bandwidth by each pod


        @smoke
        Scenario: Transmit Bandwidth Query on Metrics tab: M-06-TC05
            Given user is on Metrics tab
             When user selects "Transmit bandwidth" Query from Select Query dropdown
             Then user will see the Transmitted Bandwidth on Metrics tab
              And user will see the pods list
              And user will see the value of Transmitted Bandwidth by each pod


        @smoke
        Scenario: Rate of Received Packets Query on Metrics tab: M-06-TC06
            Given user is on Metrics tab
             When user selects "Rate of received packets" Query from Select Query dropdown
             Then user will see the Received Packets on Metrics tab
              And user will see the pods list
              And user will see the value of Received Packets by each pod


        @smoke
        Scenario: Rate of Transmitted Packets Query on Metrics tab: M-06-TC07
            Given user is on Metrics tab
             When user selects "Rate of transmitted packets" Query from Select Query dropdown
             Then user will see the Transmitted Packets on Metrics tab
              And user will see the pods list
              And user will see the value of Transmitted Packets by each pod


        @smoke
        Scenario: Rate of Received Packets Dropped Query on Metrics tab: M-06-TC08
            Given user is on Metrics tab
             When user selects "Rate of received packets dropped" Query from Select Query dropdown
             Then user will see the Received Packets Dropped on Metrics tab
              And user will see the pods list
              And user will see the value of Received Packets Dropped by each pod


        @smoke
        Scenario: Rate of Transmitted Packets Dropped Query on Metrics tab: M-06-TC09
            Given user is on Metrics tab
             When user selects "Rate of transmitted packets dropped" Query from Select Query dropdown
             Then user will see the Transmitted Packets Dropped on Metrics tab
              And user will see the pods list
              And user will see the value of Transmitted Packets Dropped by each pod


#Custom Query: "sum(container_memory_working_set_bytes{ namespace="openshift-monitoring", container!="POD", container!=""}) by (pod)"
        @smoke
        Scenario Outline: Custom Query on Metrics tab: M-06-TC10
            Given user is on Metrics tab
             When user selects "Custom query" Query from Select Query dropdown
              And user enters the custom query "<query>"
             Then user will see the output of the custom query
              And user will see the pods list
              And user will see the value of given custom query by each pod

        Examples:
                  | query                                                                                                                |
                  | sum(container_memory_working_set_bytes{ namespace="openshift-monitoring", container!="POD", container!=""}) by (pod) |


        @regression
        Scenario: Show PromQL button on Metrics tab: M-06-TC11
            Given user is on Metrics tab
             When user selects "CPU usage" Query from Select Query dropdown
              And user clicks on Show PromQL button
             Then user will see the query ran to see CPU Usage
              And user will see Hide PromQL button


        @regression
        Scenario: Hide PromQL button on Metrics tab: M-06-TC12
            Given user is on Metrics tab
             When user selects "CPU usage" Query from Select Query dropdown
              And user clicks on Show PromQL button
              And user clicks on Hide PromQL button
             Then user wont see the query


        @manual
        Scenario: Time range dropdown: M-06-TC13
            Given user is on Metrics tab
             When user selects "CPU usage" Query from Select Query dropdown
              And user selects "1 hour" on Time range dropdown
             Then user will see CPU Usage for past one hour


        @manual
        Scenario: Reset Zoom button: M-06-TC14
            Given user is on Metrics tab
             When user selects "CPU usage" Query from Select Query dropdown
              And user selects "1 hour" on Time range dropdowne
              And user clicks on Reset Zoom button
             Then user will see Time range changed to 30 minutes
