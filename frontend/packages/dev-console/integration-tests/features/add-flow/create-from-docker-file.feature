Feature: Create Application from Docker file
    As a user, I want to create the application, component or service from Add Flow Docker file

Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-addflow-docker"
    And user is at Add page


@regression
Scenario: Dockerfile details after entering git repo url: A-06-TC01
   Given user is on Import from Docker file page
   When user enters docker git url as "https://github.com/sclorg/nodejs-ex.git"
   Then git url gets Validated
   And application name displays as "nodejs-ex-git-app"
   And name field auto populates with value "nodejs-ex-git" in Import from Docker file page


@regression, @smoke
Scenario Outline: Create a workload from Docker file with "<resource_type>" as resource type : A-06-TC03, A-06-TC04
   Given user is on Import from Docker file page
   When user enters docker git url as "https://github.com/sclorg/nodejs-ex.git"
   And user enters Name as "<name>"
   And user selects "<resource_type>" radio button in Resoruce type section
   And user clicks Create button on Add page
   Then user will be redirected to Topology page
   And user is able to see workload "<name>" in topology page

Examples:
| resource_type     | name            |
| Deployment        | nodejs-ex-git   |
| Deployment Config | nodejs-ex-1-git |


@regression
Scenario: Perform cancel operation on Dockerfile form should will be redirected the user to Add page : A-06-TC02
   Given user is on Import from Docker file page
   When user enters docker git url as "https://github.com/sclorg/nodejs-ex.git"
   And user selects "Deployment" radio button in Resoruce type section
   And user clicks Cancel button on Add page   
   Then user will be redirected to Add page
