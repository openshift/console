@getting-started
Feature: Login to developer perspective
              As a user I want to land on developer perspective when login to openshift console as a developer


        @regression @to-do
        Scenario: Developer perspective display on login to open shift application using developer credentials: GS-01-TC01
            Given user is at login page
             When user enters the username as "username"
              And password as "password"
              And clicks login
             Then user redirects to developer perspective
