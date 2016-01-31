var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var database = undefined;
var connected = false;
var url = "mongodb://valentin-boucher.fr:27017/raid";
var Q = require('q');

function connection(callback){
  var d = Q.defer();
  MongoClient.connect(url, function(error, db_) {
    if(error == null){
      database = db_;
      callback().then( function(){disconnect()} )
    }else{
      console.log("erreur lors de la connexion à la BDD : ")
      console.log(error);
    }
  })
};

function findWhere(collection, conditions, callback){
  var promise = Q.defer();
  connection(function(){
    var d2 = Q.defer();
    var result = database.collection(collection).find(conditions);
    result.toArray(function(error,datas){
      console.log(error);
      callback(error,datas);
      console.log("promise resolve");
      d2.resolve();
      promise.resolve();
    });
    return d2.promise;
  });
  return promise.promise;
}


function disconnect(){
  if(database != undefined){
    console.log("disconnect");
    database.close();
    database = undefined;
    connected = false;

  }
}
module.exports = {
  connection: connection,
  findWhere : findWhere,
  disconnect: disconnect
}
