// Jenkinsfile
pipeline {
    agent any
    tools { nodejs 'NodeJS 22' }
    environment {
        DOCKER_ORG_NAME = "hasbynatawijaya" // Replace with your Docker Hub username
        APP_NAME = "test-deploy-angular"
        DOCKER_REGISTRY = "docker.io"
        TARGET_ENV = ""
        DOCKER_IMAGE_TAG = ""
        DOCKER_COMPOSE_FILE = ""
        TARGET_PORT = "" // Not needed for Nginx proxy setup anymore
        CONTAINER_NAME = ""
        REMOTE_APP_DIR = "/home/vagrant/angular-app"
        VM_IP = "192.168.56.11" // Your VM's IP address
        VM_USER = "vagrant"     // Your VM's SSH user
        VM_SSH_CREDENTIAL_ID = "vm-ssh-key" // The ID of your SSH credentials in Jenkins
    }
    stages {
        stage('Set Environment Variables') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'main') {
                        env.TARGET_ENV = 'prod'; env.DOCKER_IMAGE_TAG = 'prod'; env.DOCKER_COMPOSE_FILE = 'docker-compose.prod.yml'; env.CONTAINER_NAME = "${env.APP_NAME}-prod"
                    } else if (env.BRANCH_NAME == 'stage') {
                        env.TARGET_ENV = 'stage'; env.DOCKER_IMAGE_TAG = 'stage'; env.DOCKER_COMPOSE_FILE = 'docker-compose.stage.yml'; env.CONTAINER_NAME = "${env.APP_NAME}-stage"
                    } else if (env.BRANCH_NAME == 'dev') {
                        env.TARGET_ENV = 'dev'; env.DOCKER_IMAGE_TAG = 'dev'; env.DOCKER_COMPOSE_FILE = 'docker-compose.dev.yml'; env.CONTAINER_NAME = "${env.APP_NAME}-dev"
                    } else {
                        echo "Detected feature branch: ${env.BRANCH_NAME}. Will only build and push Docker image."
                        env.TARGET_ENV = 'feature'; env.DOCKER_IMAGE_TAG = "${env.BRANCH_NAME.replace('/', '-')}-${env.BUILD_NUMBER}"
                    }
                    echo "Deploying to ${env.TARGET_ENV} environment."
                }
            }
        }
        stage('Checkout') {
            steps { git 'https://github.com/YOUR_GITHUB_USERNAME/angular-multi-env-app.git' }
        }
        stage('Build Angular App') {
            when { expression { return env.TARGET_ENV != 'feature' } }
            steps { sh 'npm install --legacy-peer-deps'; sh "npm run build -- --configuration production" }
        }
        stage('Build Docker Image') {
            when { expression { return env.TARGET_ENV != 'feature' } }
            steps { script { def dockerImage = docker.build("${DOCKER_ORG_NAME}/${APP_NAME}:${env.DOCKER_IMAGE_TAG}", "."); } }
        }
        stage('Push Docker Image') {
            when { expression { return env.TARGET_ENV != 'feature' } }
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    script {
                        docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-hub-credentials') {
                            def dockerImage = docker.image("${DOCKER_ORG_NAME}/${APP_NAME}:${env.DOCKER_IMAGE_TAG}")
                            dockerImage.push()
                            if (env.TARGET_ENV == 'prod') { dockerImage.tag("${DOCKER_ORG_NAME}/${APP_NAME}:latest"); dockerImage.push('latest') }
                        }
                    }
                }
            }
        }
        stage('Deploy to VM') {
             when { expression { return env.TARGET_ENV != 'feature' } }
             steps {
                script {
                    def remote = [:]
                    remote.name = env.VM_IP
                    remote.host = env.VM_IP
                    remote.user = env.VM_USER
                    remote.allowAnyHosts = true // Set to true if you don't want to manage known_hosts on Jenkins

                    echo "Attempting SSH connection using credential ID: ${env.VM_SSH_CREDENTIAL_ID}"

                    withCredentials([sshUserPrivateKey(credentialsId: env.VM_SSH_CREDENTIAL_ID, keyFileVariable: 'identityFile', usernameVariable: 'userName')]) {
                        // Add debug print to see if identityFile is populated
                        echo "Resolved identityFile path: ${identityFile}"

                        remote.identityFile = identityFile
                        remote.user = userName

                        echo "Attempting simple SSH command to ${remote.host} as ${remote.user}"
                        try {
                            // Execute a very simple command to test the connection
                            def result = sshCommand remote: remote, command: "echo 'Hello from VM! Current directory: $(pwd)' && ls -la /home/vagrant"
                            echo "SSH Command Output: ${result}"
                            echo "Simple SSH command succeeded."
                        } catch (Exception e) {
                            echo "ERROR: Simple SSH command failed: ${e.getMessage()}"
                            echo "Full stack trace (check Jenkins console for more details):"
                            e.printStackTrace() // Print stack trace to console
                            currentBuild.result = 'FAILURE' // Explicitly fail the build
                            throw e // Re-throw to propagate the failure
                        }
                    }
                }
            }
        }
    }
}