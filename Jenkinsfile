pipeline {
  agent {
    docker {
      image 'node:14.17'
    }
  }

  stages {
    stage('build') {
      steps {
        echo "Running build ${env.BUILD_ID} on ${env.JENKINS_URL}"
        sh '''apt-get update -y'''
        echo "We can skip clone the repo if we are using jenkins multi-pipline source"
        git 'https://github.com/openshift/console'
        sh '''apt-get install -y sudo git build-essential apt-transport-https ca-certificates curl software-properties-common python'''
        echo "Current working directory ${PWD}"
        sh "ls -la ${pwd()}"
        echo "Installing the packages required for cypress testing"
        sh '''apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb'''
        sh 'cd frontend && yarn install'
      }
    }
    stage('cypress parallel tests') {
      environment {
        //CYPRESS_RECORD_KEY = credentials('ceph-tests')
        //CYPRESS_trashAssetsBeforeRuns = 'false'
      }

      parallel {
        stage('Test1') {
          steps {
            echo "Running build ${env.BUILD_ID}"
            sh "cd frontend && /node_modules/cypress/bin/cypress run"
            // TODO: Add the required tests and configuration
            //sh "test-cypress.sh -p pipelines"
          }
        }
      }

    }
  }
}

