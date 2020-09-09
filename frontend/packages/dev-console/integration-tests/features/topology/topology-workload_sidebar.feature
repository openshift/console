Feature: Sidebar in topology
	As a user, I want to check sidebar of workloads

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-topology-sidebar"


@regression, @smoke
Scenario Outline: Sidebar for workload: T-05-TC01
   Given user created workload "<workload_name>" with resource type "<resource_type>" 
   When user clicks on workload "<workload_name>"
   Then user can see sidebar opens with Resources tab selected by default
   And user can see sidebar Details, Resources and Monitoring tabs
   And user verifies name of the node "<workload_name>" and Action menu present on top of the sidebar
   And user is able to see health check notifiation
   And user can see close button
   
Examples:
    | resource_type     | workload_name   |
    | deployment        | nodejs-ex-git   |
    | deployment config | dancer-ex-git-1 |
