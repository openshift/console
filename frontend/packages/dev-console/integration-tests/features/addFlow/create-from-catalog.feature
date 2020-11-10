Feature: Create Application from Catalog file
    As a user I want to create the application, component or service from Add Flow Catlog file

    Background:
        Given user is at developer perspective
        And user has created namespace starts with "aut-addflow-catalog"
        And user is at Add page


    Scenario: Developer Catalog page details: A-12-TC04
        When user selects From Catalog card from add page
        Then user will be redirected to Developer Catalog page
        And user is able to see Operator Backed, Helm Charts, Builder Image, Template, Service Class types are not selected by default
        And search option is displayed in Developer Catalog page
        And GroupBy filter is selected with default option None


    Scenario Outline: Filter the cards with type
        Given user is at Developer Catlog page
        When user selects "<type>" option from Type section
        Then user is able to see cards related to "<type>"

        Examples:
            | type            |
            | Helm Charts     |
            | Builder Images  |
            | Template        |


    Scenario: Filter the catalog using GroupBy option
        Given user is at Developer Catlog page
        When user searches "node" card from catalog page
        Then user is able to see cards with name containing "node"


    @regression
    Scenario: Create the workload using template : A-12-TC01
        Given user is at Developer Catlog page
        When user selects "Template" option from Type section
        And user searches and selects Template card "CakePHP + MySQL" from catalog page
        And user clicks Instantiate Template button on side bar
        And user enters Name as "php-one" in Instantiate Template page
        And user clicks create button on Instantiate Template page with default values
        Then user will be redirected to Topology page
        And user is able to see workload "php-one" in topology page


    @regression
    Scenario: Create the workload using Builder Image: A-12-TC02
        Given user is at Developer Catlog page
        When user selects "Builder Image" option from Type section
        And user searches and selects Builder Image card "Node.js" from catalog page
        And user clicks Create Application button on side bar
        And user enters Git Repo url in s2i builder image page as "https://github.com/sclorg/nodejs-ex.git"
        And user clicks create button
        Then user will be redirected to Topology page
        And user is able to see workload "nodejs-ex-git" in topology page


    @manual
    Scenario: Create the workload using Service Class : A-12-TC03
        Given user is at Developer Catlog page
        When user selects "Service Class" option from Type section
        Then user is able to see cards with name contains "node"
