@Pod-Traffic-Status
Feature: Traffic Status details for pods
              As a administrator, I want to see whether a pod is receiving traffic or not.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-pods"
              And user is at Add page
              And user has created workload "nodejs-ex-git" with resource type "deployment"
              And user navigates to administrator perspective
              And user navigates to pods tab
 
        @regression 
        Scenario: Checking traffic status for pods in a project: P-01-TC01
             When user selects Receiving Traffic column to show in table
             Then user is able to see Receiving Traffic column in the list

        @regression 
        Scenario: Checking traffic status for pods for all projects: P-01-TC02
             When user selects "All Projects" from the project menu
              And user selects Receiving Traffic column to show in table
             Then user is able to see Receiving Traffic column in the list

