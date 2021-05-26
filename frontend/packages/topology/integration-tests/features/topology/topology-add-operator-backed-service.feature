@topology
Feature: Create Operator backed service in topology page
              As a user, I want to add operator backed service to existing workloads in topology


        Background:
            Given user has installed OpenShift Serverless Operator
              And user has installed Red Hat OpenShift Jaeger Operator
              And user has installed Service Binding Operator
              And user has installed PostgreSQL Operator provided by Red Hat
              And user is at developer perspective
              And user has created or selected namespace "aut-topology-operator-backed"
              And user is at Topology page


        @regression @manual
        Scenario: Create Operator Backed serivce using visual connector from existing workload: T-04-TC01
            Given user has created workload "hello-openshift"
             When user drags connector from "hello-openshift" workload
              And user drops visual connector on empty graph
              And user clicks on Operator Backed option
              And user searches for Jaeger
              And user clicks on the Jaeger card
              And user clicks on Create button on side bar
              And user clicks on Create button on Create Jaeger page
             Then user will see visual connection between "hello-openshift" and Jaeger operator backed service


        @regression @manual
        Scenario: Create Operator Backed serivce using visual connector from existing knative service: T-04-TC02
            Given user has created knative service "knative demo"
             When user drags connector from "knative-demo" workload
              And user drops visual connector on empty graph
              And user clicks on Operator Backed option
              And user searches for Jaeger
              And user clicks on the Jaeger card
              And user clicks on Create button on side bar
              And user clicks on Create button on Create Jaeger page
             Then user will see visual connection between "knative-demo" and Jaeger operator backed service


        @regression @manual
        Scenario: Create Operator Backed serivce using binding connector from workload: T-04-TC03
            Given user has created "nodejs-app" workload
             When user drags connector from "nodejs-app" workload
              And user drops visual connector on empty graph
              And user clicks on Operator Backed option
              And user searches for PostgreSQL
              And user clicks on the PostgreSQL provided by Red Hat card
              And user clicks on Create button on side bar
              And user clicks on Create button on Create Database page
             Then user will see binding connection between "nodejs-app" and PostgreSQL operator backed service
