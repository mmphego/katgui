This project will become the new UI interface for CAM in the MeerKAT project.

Loosely following Todd Moto's styleguide: github.com/toddmotto/angularjs-styleguide#modules

After cloning the repo do:

Download and install http://nodejs.org/

Navigate to the project folder

>npm install

>sudo npm install -g bower
>sudo npm install -g gulp

>bower install

To use gulp to host the project do:
>gulp webserver

To build the production version do:
>gulp build

Which will minify and concat to the dist/ folder.

This hosts the project on http://localhost:8000, open in a Chrome browser
