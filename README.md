Steps to prepare developer workstation and run recime-headchat:

1. Clone this repo.

2. Open command shell and execute the following command to install http-server

    `npm install http-server -g`
    
3. Navigate to the root directory of the codebase and execute the following command to install required node packages

    `npm install`
   
4. Execute the following command to build the source code.
   
    `npm run development`
   
5. The above step creates a `dist` directory in the project root directory.

6. Now navigate to the dist directory and execute.

    `http-server -o`

7. The above opens your default web browser now navigates to the `/test.html`.
