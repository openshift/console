@topology @ODC6771
Feature: Update user in topology page if Quotas has been reached in a namespace
            If any resource reached resource quota limit, a warning alert will be displayed for the user in Topology page.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology"


        @regression
        Scenario: single resource reached quota: T-19-TC01
            Given user has created workload with resource type deployment
             When user creates resource quota 'resourcequota1' by entering 'testData/resource-quota/resource-quota.yaml' file data
              And user navigates to Topology page
              And user clicks on link to view resource quota details
             Then user is redirected to resource quota details page
        
        
        @regression
        Scenario: multiple resources reached quota: T-19-TC02
            Given user has created workload with resource type deployment
              And user has created two resource quotas using 'testData/resource-quota/resource-quota.yaml' file
             When user navigates to Topology page
              And user clicks on link to view resource quota details
             Then user is redirected to resource quota list page
   

