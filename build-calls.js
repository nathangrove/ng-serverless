/*
* @Author: ngrove
* @Date:   2017-07-19 10:28:44
* @Last Modified by:   ngrove
* @Last Modified time: 2017-07-21 23:28:48
*/

'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var fs = require('fs');
var path = require('path');
var request = require('request');
var crypto = require('crypto');

var serverlessPath = path.resolve('./src/serverless');

var rootPath = `${serverlessPath}/root/`;

var configPath = `${serverlessPath}/serverless.js`;

var distPath = `${__dirname}/serverless.calls.ts`;

var config = JSON.parse(fs.readFileSync(configPath));
if (!config){
  console.error(`Could not find serverless configuration file: ${configPath}`);
  process.exit(1);
}

var calls = config.calls || {};


var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

function writeConfig(){
  console.log("Writing configuration file");
  console.log(calls);

  var callsObj = {};
  for (var path in calls) {
    callsObj[path] = { 
      name: calls[path].name, 
      signature: calls[path].signature,
      hash: calls[path].hash,
      script: calls[path].script
    };
  }
  var jsConfig = {};
  jsConfig.platform = config.platform;
  jsConfig.calls = callsObj;  
  fs.writeFileSync(configPath,JSON.stringify(jsConfig,null,2));

  var callsObj = {};
  for (var path in calls){ 
    callsObj[path] = calls[path].script; 
  };
  var serverlessConfig = {};
  serverlessConfig['platform'] = config.platform.url;
  serverlessConfig['calls'] = callsObj;
  fs.writeFileSync(distPath,'export const ServerlessConfig = ' + JSON.stringify(serverlessConfig,null,2));
}


walk(rootPath, function(err, files) {
  if (err) {
    console.error("The serverless folder doesn't appear to exist: " + path.reslve('./src/serverless'));
    process.exit(1);
  }

  files = files.filter(f => f.split("/").pop().indexOf('serverless') != 0);

  var completedCalls = 0;
  files.forEach( (file,idx) => {

    let path = file.replace(rootPath,'').replace('index','').split('.')[0];

    let call = calls[path] || {};
    call.code = fs.readFileSync(file).toString();

    let hash = crypto.createHash('md5').update(call.code).digest("hex");
    if (call.hash == hash) {
      console.log(`${path} unchanged. Skipping`);
      calls[path] = call;
      completedCalls++;
      if (files.length == completedCalls) writeConfig();
      return;
    } else {
      call.hash = hash;
    }

    call.name = /\/\/NAME:(.*)/g.exec(call.code);
    call.name = call.name ? call.name[1] : null;
    call.active = true;

    // POST
    if (!calls[path]){
      console.log("Creating call:",path);
      request.post(`${config.platform.url}/mycalls`,{ 
        auth: {
          user: config.platform.username,
          password: config.platform.password
        },
        json: call 
      },(err,res,c) => {

        if (err) {
          console.error("Error creating calls:",err);
          completedCalls++;
          if (files.length == completedCalls) writeConfig();
          return;
        } else if (!c.signature){
          console.error(`Error creating call "${call.name}": ${JSON.stringify(c)}`);
          completedCalls++;
          if (files.length == completedCalls) writeConfig();
          return;
        } else {
          console.log(c);
        }

        delete call.code;
        call.signature = c.signature;
        call.script = c.code;
        calls[path] = call;
        completedCalls++;

        if (files.length == completedCalls) writeConfig();
      });

    // PUT
    } else {
      console.log("Updating call:",path);
      request.put(`${config.platform.url}/mycalls/${call.signature}`,{ 
        auth: {
          user: config.platform.username,
          password: config.platform.password
        },
        json: call
      },(err,res,c) => {

        if (err) {
          console.error("Error updating calls:",err);
          process.exit(1);
        }
        
        delete call.code;
        call.signature = c.signature;
        call.script = c.code;
        calls[path] = call;
        completedCalls++;

        if (files.length == completedCalls) writeConfig();
      });
    }

  });

});
