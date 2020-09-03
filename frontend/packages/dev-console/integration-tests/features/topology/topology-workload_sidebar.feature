Feature: Sidebar in topology
	As a user, I want to check sidebar of workloads

Background:
    Given user is at the Topolgy page
    And user has selected namespace "aut-topology-sidebar"


@regression, @smoke
Scenario Outline: Sidebar of workload with "<resource_type>": T-05-TC01
   Given user created workload "<workload_name>" with resource type "<resource_type>" 
   When user clicks on workload "<workload_name>"
   Then right sidebar opens with Resources tab selected by default 
   And user checks for sidebar tabs as Details, Resources and Monitoring
   And user verifies name of the node "<workload_name>" and Action menu present on top of the sidebar
   And user able to see health check notifiation for "<resource_type>"
   And user checks for close button on top right corner of sidebar 

Examples:
    | resource_type     | workload_name   |
    | deployment        | nodejs-ex-git   |
    | deployment config | dancer-ex-git-1 |
