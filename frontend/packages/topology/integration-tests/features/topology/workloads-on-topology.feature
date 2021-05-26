@topology
Feature: Topology
    User will be able to create different types of workloads like Cron Job, Job and Pod and will be able to see it on Topology page


        Background:
            Given user is at developer perspective
              And user is at the Topology page


        Scenario: Create Cron Job type workload: T-17-TC01
             When user has created or selected namespace "aut-workloads-admin"
              And user applies cronjob YAML
              And user is at namespace "aut-workloads-admin"
             Then user will see cron job with name "example-cronjob" on topology page


        Scenario: Create Job type workload: T-17-TC02
             When user applies job YAML
              And user is at namespace "aut-workloads-admin"
             Then user will see job with name "example-job" on topology page


        Scenario: Create Pod type workload: T-17-TC03
             When user applies pod YAML
              And user is at namespace "aut-workloads-admin"
             Then user will see pod with name "example-pod" on topology page
