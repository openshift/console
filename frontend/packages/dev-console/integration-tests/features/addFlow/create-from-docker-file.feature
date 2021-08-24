@add-flow @odc-5009
Feature: Create Application from Docker file
              As a user, I want to create the application, component or service from Add Flow Docker file

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-addflow-docker"
              And user is at Add page


        @regression
        Scenario: Dockerfile details after entering git repo url: A-05-TC01
            Given user is on Import from Git form
             When user enters Git Repo URL as "https://github.com/rohitkrai03/flask-dockerfile-example"
             Then git url "https://github.com/rohitkrai03/flask-dockerfile-example" gets Validated
              And application name displays as "flask-dockerfile-example-app"
              And name field auto populates with value "flask-dockerfile-example" in Import from Git form


        @smoke
        Scenario Outline: Create a workload from Docker file with "<resource_type>" as resource type: A-05-TC02
            Given user is on Import from Git form
             When user enters Git Repo URL as "https://github.com/rohitkrai03/flask-dockerfile-example"
              And user enters Name as "<name>" in Docker file page
              And user selects "<resource_type>" radio button in Resource type section
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "<name>" in topology page

        Examples:
                  | resource_type     | name         |
                  | Deployment        | dockerfile   |
                  | Deployment Config | dockerfile-1 |


        @regression
        Scenario: Performing cancel operation on Dockerfile form should redirected the user to Add page: A-05-TC03
            Given user is on Import from Git form
             When user enters Git Repo URL as "https://github.com/rohitkrai03/flask-dockerfile-example"
              And user selects "Deployment" radio button in Resource type section
              And user clicks Cancel button on Add page
             Then user will be redirected to Add page
