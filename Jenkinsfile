node('docker') {
    stage 'Cleanup workspace'
    dir('katgui') {
        deleteDir()
    }
    sh 'rm -rf *.deb'

    docker.image('camguinode:latest').inside('-u root') {
        stage 'Checkout SCM'
            checkout scm
            sh "git checkout ${env.BRANCH_NAME} && git pull"

        stage 'Install & Unit Tests'
            timeout(time: 30, unit: 'MINUTES') {
                sh './update.sh'
            }

        stage 'Build .whl & .deb'
            sh 'mv dist/ katgui'
            sh 'fpm -s "dir" -t "deb" --name katgui --version $(kat-get-version.py) --description "The operator interface for SKA-SA" katgui=/var/www'
            // chmod for cleanup stage
            sh 'chmod 777 -R katgui *.deb'

        stage 'Archive build artifact: .whl & .deb'
            archive '*.deb'

        stage 'Trigger downstream publish'
            build job: 'publish-local', parameters: [
                string(name: 'artifact_source', value: "${currentBuild.absoluteUrl}/artifact/dist/*zip*/dist.zip"),
                string(name: 'source_branch', value: "${env.BRANCH_NAME}")]
    }
}
