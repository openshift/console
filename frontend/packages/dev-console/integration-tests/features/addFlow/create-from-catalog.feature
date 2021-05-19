@add-flow
Feature: Create Application from Catalog file
              As a user, I want to create the application, component or service from Add Flow Catalog file

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-addflow-catalog"
              And user is at Add page


        @regression
        Scenario: Create the workload using Builder Image: A-01-TC01
            Given user is at Developer Catalog page
             When user selects "Builder Images" option from Type section
              And user searches and selects Builder Image card "Node.js" from catalog page
              And user clicks Create Application button on side bar
              And user enters Git Repo url in s2i builder image page as "https://github.com/sclorg/nodejs-ex.git"
              And user enters Application name as "builder-app"
              And user enters workload name as "builder"
              And user clicks create button
             Then user will be redirected to Topology page
              And user is able to see workload "builder" in topology page


        @smoke
        Scenario Outline: Deploy Application using Catalog Template "<template_type>": A-01-TC02
            Given user is at Developer Catalog page
              And user is at Templates page
             When user selects "<template_type>" from Templates type
              And user searches and selects Template card "<card_name>" from catalog page
              And user clicks Instantiate Template button on side bar
              And user clicks create button on Instantiate Template page
             Then user will be redirected to Topology page
              And user is able to see workload "<workload_name>" in topology page

        Examples:
                  | template_type | card_name                             | workload_name             |
                  | CI/CD         | Jenkins                               | jenkins                   |
                  | Databases     | MariaDB                               | mariadb                   |
                  | Languages     | Node.js + PostgreSQL (Ephemeral)      | nodejs-postgresql-example |
                  | Middleware    | Apache HTTP Server                    | httpd-example             |
                  | Other         | Nginx HTTP server and a reverse proxy | nginx-example             |
