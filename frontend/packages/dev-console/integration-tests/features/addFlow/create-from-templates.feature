@add-flow
Feature: Create Application using Templates
              As a user, I want to deploy the application using Templates provided in Developer Catalog

        Background:
            Given user is at developer perspective
              And user is at Developer Catalog page
              And user has created or selected namespace "aut-addflow-templates"
              And user is at Templates page


        Scenario: Deploy CI/CD Application using Catalog Templates
             When user selects CI/CD type
              And user searches and selects Template card "Jenkins" from catalog page
              And user clicks on Instantiate Template button
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user is able to see workload "jenkins" in topology page


        Scenario: Deploy Database Application using Catalog Templates
             When user selects Databases type
              And user searches and selects Template card "MariaDB" from catalog page
              And user clicks on Instantiate Template button
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user is able to see workload "mariadb" in topology page


        Scenario: Deploy Application using Languages Templates
             When user selects Languages type
              And user searches and selects Template card "Node.js + PostgreSQL (Ephemeral)" from catalog page
              And user clicks on Instantiate Template button
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user is able to see workload "nodejs-postgresql-persistent" in topology page


        Scenario: Deploy MiddleWare Application using Catalog Templates
             When user selects MiddleWare type
              And user searches and selects Template card "Apache HTTP Server" from catalog page
              And user clicks on Instantiate Template button
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user is able to see workload "httpd-example" in topology page


        Scenario: Deploy Application using Other types of Catalog Templates
             When user selects Other type
              And user searches and selects Template card "Nginx HTTP server and a reverse proxy" from catalog page
              And user clicks on Instantiate Template button
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user is able to see workload "nginx-example" in topology page
