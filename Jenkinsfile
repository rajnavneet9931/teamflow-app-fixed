pipeline {
    agent any

    environment {
        APP_DIR = "/home/ubuntu/Teamflow-app-main"
        REPO_URL = "https://github.com/rajnavneet9931/teamflow-app-fixed.git"
        BRANCH = "main"
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Clone Repository') {
            steps {
                git branch: "${BRANCH}", url: "${REPO_URL}"
            }
        }

        stage('Copy Project to Target Directory') {
            steps {
                sh '''
                    rm -rf ${APP_DIR}
                    mkdir -p ${APP_DIR}
                    cp -r * ${APP_DIR}/
                    cp -r .[^.]* ${APP_DIR}/ || true
                '''
            }
        }

        stage('Create .env File') {
            steps {
                writeFile file: '.env', text: '''
DB_NAME=teamflow
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=mysecret123
'''
                sh '''
                    cp .env ${APP_DIR}/.env
                '''
            }
        }

        stage('Stop Old Containers') {
            steps {
                sh '''
                    cd ${APP_DIR}
                    docker-compose down || true
                '''
            }
        }

        stage('Build and Start Containers') {
            steps {
                sh '''
                    cd ${APP_DIR}
                    docker-compose up --build -d
                '''
            }
        }

        stage('Check Running Containers') {
            steps {
                sh '''
                    cd ${APP_DIR}
                    docker-compose ps
                '''
            }
        }
    }

    post {
        success {
            echo 'Deployment successful'
        }
        failure {
            echo 'Deployment failed'
        }
    }
}
