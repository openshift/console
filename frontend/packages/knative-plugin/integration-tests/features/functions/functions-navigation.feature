@knative-serverless @knative
Feature: Navigations to Serverless Functions page 
              As a user, I want to navigate to Serverless functions page in developer perspective

        Background:
            Given user is at developer perspective 
              And user has created or selected namespace "aut-knative-functions"

        
        @smoke
        Scenario: User navigates to Functions page when no Function is created: KN-08-TC01
             When user clicks on the Functions tab
             Then user redirected to Functions page
              And user is able to see the message "No Functions found"

        @smoke
        Scenario: User navigates to Functions page when Function is created: KN-08-TC02
            Given user has created a serverless function using repo "https://github.com/Lucifergene/serverless-func-repo" with name "serverless-func-test-repo"
             When user clicks on the Functions tab
             Then user redirected to Functions page
              And user will see the serverless functions listed

        
        @smoke
        Scenario: User navigates to Function details page: KN-08-TC03
            Given user clicks on the Functions tab
             When user clicks on the function name "serverless-func-test-repo"
             Then user will see the Details page opened
              And user is able to see service URL and Revisions details
              And user is able to see Containers sections
              And user is able to see Revisions, Routes and Pods tabs

 