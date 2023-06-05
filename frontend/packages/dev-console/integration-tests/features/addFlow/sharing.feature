@add-flow @dev-console @odc-6452
Feature: Project Access page
              As a user, I want to access project access page through Add page


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-add-project-access"


        @regression
        Scenario: Project Access page through Add page: A-13-TC01
            Given user is at Add page
             When user clicks on Sharing card in Add page
             Then user can see "Project access" page
