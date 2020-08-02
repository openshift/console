Feature: Sidebar in topology
	As a user, I want to check sidebar of workloads

Background:
    Given user is in topology

@regression, @smoke
Scenario: Sidebar of worload : T-05-TC01
   Given topology has workloads
   When user clicks on workload
   Then right sidebar opens with Resources tab selected by default 
   And user checks for sidebar tabs as Details, Resources and Monitoring
   And user verifies name of the node and Action menu present on top of the sidebar
   And user able to see health check notifiation above the tabs for deployment and deployment-config
   And user checks for close button on top right corner of sidebar 
