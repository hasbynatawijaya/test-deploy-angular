// Jenkinsfile
pipeline {
    agent any
    tools { nodejs 'NodeJS 18' }
    environment {
        DOCKER_ORG_NAME = "hasbynatawijaya" // Replace with your Docker Hub username
        APP_NAME = "my-angular-app"
        DOCKER_REGISTRY = "docker.io"
        TARGET_ENV = ""
        DOCKER_IMAGE_TAG = ""
        DOCKER_COMPOSE_FILE = ""
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
                        env.TARGET_ENV = 'prod'; env.DOCKER_IMAGE_TAG = 'prod'; env.DOCKER_COMPOSE_FILE = 'docker-compose.prod.yml'
                    } else if (env.BRANCH_NAME == 'stage') {
                        env.TARGET_ENV = 'stage'; env.DOCKER_IMAGE_TAG = 'stage'; env.DOCKER_COMPOSE_FILE = 'docker-compose.stage.yml'
                    } else if (env.BRANCH_NAME == 'dev') {
                        env.TARGET_ENV = 'dev'; env.DOCKER_IMAGE_TAG = 'dev'; env.DOCKER_COMPOSE_FILE = 'docker-compose.dev.yml'
                    } else {
                        echo "Detected feature branch: ${env.BRANCH_NAME}. Will only build and push Docker image."
                        env.TARGET_ENV = 'feature'; env.DOCKER_IMAGE_TAG = "${env.BRANCH_NAME.replace('/', '-')}-${env.BUILD_NUMBER}"
                    }
                    echo "Deploying to ${env.TARGET_ENV} environment."
                }
            }
        }
        stage('Checkout') {
            steps { git 'https://github.com/hasbynatawijaya/test-deploy-angular.git' }
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
                    echo "--- DEBUGGING SSH CONNECTION START (Full Pipeline) ---"
                    echo "VM_IP: '${env.VM_IP}'"
                    echo "VM_USER: '${env.VM_USER}'"
                    echo "VM_SSH_CREDENTIAL_ID: '${env.VM_SSH_CREDENTIAL_ID}'"

                    // Ensure the credential ID is not empty
                    if (env.VM_SSH_CREDENTIAL_ID == null || env.VM_SSH_CREDENTIAL_ID.trim().isEmpty()) {
                        error "VM_SSH_CREDENTIAL_ID is null or empty. Please check Jenkinsfile environment variables."
                    }

                    def remote = [:]
                    remote.name = env.VM_IP
                    remote.host = env.VM_IP
                    remote.user = env.VM_USER
                    remote.allowAnyHosts = true

                    // Declare identityFile and userName outside withCredentials to ensure scope
                    def identityFileResolved = null
                    def userNameResolved = null

                    try {
                        withCredentials([sshUserPrivateKey(credentialsId: env.VM_SSH_CREDENTIAL_ID, keyFileVariable: 'identityFile', usernameVariable: 'userName')]) {
                            // Assign the bound variables to our local variables
                            identityFileResolved = identityFile
                            userNameResolved = userName

                            echo "Inside withCredentials block (Full Pipeline)."
                            echo "identityFile (from binding): '${identityFileResolved}'" // CRUCIAL DEBUG OUTPUT
                            echo "userName (from binding): '${userNameResolved}'" // Should be 'vagrant'

                            // Sanity check: Ensure identityFile is populated by withCredentials
                            if (identityFileResolved == null || identityFileResolved.trim().isEmpty()) {
                                error "identityFile is null or empty AFTER withCredentials. Credential binding failed. Check credential ID and private key content."
                            }
                        }

                        // Now use the resolved variables, which should be populated
                        remote.identityFile = identityFileResolved
                        remote.user = userNameResolved

                        echo "Attempting SSH commands to ${remote.host} as ${remote.user} using identity file: ${remote.identityFile}"

                        // Create directory and transfer docker-compose & nginx config
                        sshScript remote: remote, script: '''
                            mkdir -p ''' + env.REMOTE_APP_DIR + '''/''' + env.TARGET_ENV + '''
                        '''

                        // Transfer docker-compose.yml
                        sshPut remote: remote, from: "${env.DOCKER_COMPOSE_FILE}", into: "${env.REMOTE_APP_DIR}/${env.TARGET_ENV}/${env.DOCKER_COMPOSE_FILE}"
                        // Transfer nginx-env.conf
                        sshPut remote: remote, from: "nginx-${env.TARGET_ENV}.conf", into: "${env.REMOTE_APP_DIR}/${env.TARGET_ENV}/nginx-${env.TARGET_ENV}.conf"

                        // Execute deployment commands on VM using triple single quotes
                        sshScript remote: remote, script: '''
                            cd ''' + env.REMOTE_APP_DIR + '''/''' + env.TARGET_ENV + '''
                            echo "Pulling latest Docker image..."
                            # The service name inside docker-compose.yml is 'angular-app'
                            docker-compose -f ''' + env.DOCKER_COMPOSE_FILE + ''' pull angular-app || true
                            echo "Stopping existing container (if any)..."
                            docker-compose -f ''' + env.DOCKER_COMPOSE_FILE + ''' down || true
                            echo "Starting new container..."
                            docker-compose -f ''' + env.DOCKER_COMPOSE_FILE + ''' up -d
                            echo "Successfully deployed ''' + env.APP_NAME + ''' to ''' + env.TARGET_ENV + ''' environment on VM."
                        '''
                    } catch (Exception e) {
                        echo "ERROR: SSH deployment failed: ${e.getMessage()}"
                        echo "Full stack trace (check Jenkins console for more details):"
                        e.printStackTrace() // Print stack trace to console
                        currentBuild.result = 'FAILURE' // Explicitly fail the build
                        throw e // Re-throw to propagate the failure
                    }
                    echo "--- DEBUGGING SSH CONNECTION END (Full Pipeline) ---"
                }
            }
        }
    }
}