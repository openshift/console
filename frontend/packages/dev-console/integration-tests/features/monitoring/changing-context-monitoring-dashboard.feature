@monitoring @odc-3698
Feature: Changing context in Observe Dashboard
              As a user, I should be able to change the filter in the Observe Dashboard


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-observe"
              And user has created workload "nodejs-ex-git" with resource type "Deployment"


        @regression
        Scenario: Charts display in observe dashboard for specific workload: M-01-TC01
            Given user is at the Topology page
             When user selects the workload "nodejs-ex-git" to open the topology sidebar
              And user navigates to observe dashboard from toplogy sidebar
             Then user is able to see the workload "nodejs-ex-git" in workloads dropdown
              And user will see "CPU Usage" chart
              And user will see "CPU Quota" chart
              And user will see "Memory Usage" chart
              And user will see "Memory Quota" chart
              And user will see "Current Network Usage" chart
              And user will see "Bandwidth" charts
              And user will see "Rate of Packets" charts
              And user will see "Rate of Packets Dropped" charts


        @regression
        Scenario: Restore the selected workload on refresh: M-01-TC02
            Given user is at the Observe dashboard
             When user clicks on Dashboard dropdown
              And user selects "Kubernetes / Compute Resources / Workload" option from the dropdown
              And user clicks on Workload dropdown
              And user selects "nodejs-ex-git" option from the dropdown
              And user refreshes the page
             Then user is still able to see the same workload "nodejs-ex-git"
