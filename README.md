# ng-serverless
An Angular2+ HTTP Intercepter for [serverless](https://github.com/nathangrove/serverless.git). This package also includes a script called 'build-calls.js' which is a node script that will send your serverside code to serverless for encryption and build out the data structure for call intercetpion.

## Setup
1. Add the package to your angular2 project: `npm install nathangrove/ng-serverless`  

2. Add build command to your npm scripts: `"serverless": "node node_modules/ng-serverless/build-calls.js"`  

3. Import dependencies into your project at the top of app.module.ts file:
```
import { HttpModule, Http, XHRBackend, RequestOptions } from '@angular/http'
import { ServerlessFactory } from 'ng-serverless';
```  

4. Provide the service in the module's providers array: 
```
providers: [
  {
    provide: Http,
    useFactory: ServerlessFactory,
    deps: [XHRBackend, RequestOptions]
  }
]
```  

5. Import the HttpModule:
```
  imports: [
    BrowserModule,
    HttpModule
  ]
```
6. Create a serverless code directory and add the configuration file:
  - Create a directory `mkdir src/serverless`
  - Create the "server" root: `mkdir src/serverless/root`
  - Create configuration file: `src/serverless/serverless.js`
  ```
  {
    "platform": {
      "url": "https://your.serverless-platform.com",
      "username": "changeme",
      "password": "changeme"
    }
  }
  ```

## Use
You can create your calls in the `src/serverless/root` directory. Each file must contain only 1 call. The directory structure of your "root" folder will be used in determining the path of your request.  
Example directory structure:
```
|--root
|--| index.js
|--| hello.js
|--| foo
|--|--| index.js
|--|--| bar.js
|--|--| hello
|--|--|--| world.js
```
The given structure would give me the endpoints:
```
/                  <-- root/index.js
/hello             <-- root/hello.js
/foo               <-- root/foo/index.js
/foo/bar           <-- root/foo/bar.js
/foo/hello/world   <-- root/foo/hello/world.js
```

After you edit the calls, you should issue the command `npm run serverless`. This will:
  - send your scripts to the server
  - get the encrypted response
  - build the bundled TS file
  - add the calls to your application

Use the Http service as normal throughout the code in your application (using relative URLs for the serverless calls). However, now the calls that correspond with a serverless endpoint will be intercepted and handled by the intercepter.

## Writing serverside code
The serverside code can be any valid Serverless call. You can read more about what is included in the calls on the Serverless project's page. If you would like your call to be created on the server with a "name" (stored on the server with the decryption key), then you can add `//NAME:My call name` to the top of the script. The build-calls.js script will parse out the name and include it in the request to the server.

## Pros and Cons
There are several pros and cons to this.
  ### Pros
    - Completely self contained application
    - No worry about backend API version mismatch
    - Securely encrypted senstive code
  ### Cons
    - More data consumption than its serverside counterpart
    - PWAs are less useful (but still my preferred method)
    - The HTTP verbs get muddied up (especially PUT and DELETE)

You will just have to choose if this is right for you.  

## TODO
There is plenty to do.
- Create easier setup
- Fix HTTP verbs (perhaps allow a verb in the comments of a call or assume any verb)
- Write tests
- ...Make it better 'n stuff....

## Contributing

Fork! Modify! Request Pull!
 
## License
 
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details