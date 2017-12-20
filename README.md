This project is the Operator user interface for CAM in the MeerKAT project.

After cloning the repo do:

- Download and install http://nodejs.org/
- Download and install http://yarnpkg.com/

Navigate to the project folder
>yarn install

To use gulp to host the project locally on port 8000 do:
>gulp webserver

To build the production version do:
>gulp build

Which will minify and concat to the dist/ folder.
