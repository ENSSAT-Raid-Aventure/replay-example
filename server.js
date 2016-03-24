//Déclaration des dépendances
var http = require('http');
var url = require('url');
var querystring = require('querystring');
data = require('./js/back-end/data')
var app = require('express')();
var bodyParser = require('body-parser')
app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
var server = http.Server(app);
var io = require('socket.io').listen(server);
_ = require('underscore');
var fs = require('fs');
function_js = require('./js/back-end/function');
var api = require('./routes/api.js')(app);

//Définition et initialisation variables serveur
var clients = [];

var timeIntervalUpdate = 1000;
var index_test = 0;
var jsonLeguer = undefined;
var url = "./exemple_carte/halage1.json";
var file = null;
var tableau_data = [];

var adresseIPAutoriséeAPI = "::1"

fs.readFile(url,function(err,data){
  if(err) throw err;
  file = JSON.parse(data);
  tableau_data = function_js.get_customGeometryJSON(file,"coordinates");
});
//Lancement serveur
server.listen(8080);


//Définition des routes
app.get("/maps", function(req,res){
  res.setHeader('Content-type','text/html');
  res.sendFile('./html/index.html', {root: __dirname });
});
app.get("/css/style.css",function(req,res){
  res.setHeader('Content-type','text/css');
  res.sendFile('./css/style.css', {root: __dirname });
});
app.get("/js/script.js",function(req,res){
  res.setHeader('Content-type','text/javascript');
  res.sendFile('./js/front-end/script.js', {root: __dirname });
});
app.get("/circuit.json",function(req,res){
  res.setHeader('Content-type','text/javascript');
  res.sendFile('./carte_eric/leguer.json', {root: __dirname });
});




io.on('connection',function(socket){
  //On ajoute à la liste des sockets (utilisé pour le broadcast)
  var data_user = { socket : socket, infos : {}};
  clients.push(data_user);
  console.log("Nouveau client");
  socket.on("classement-perso",function(data){
    console.log(data);
  });
  socket.on("disconnect",function(data){
    var i = clients.indexOf(data_user);
    clients.splice(i, 1);
    console.log("Deconnexion d'un client")
  });
});


sendBroadcast = function (eventName, data){
  for(i = 0; i < clients.length; i ++)
    clients[i].socket.emit(eventName,data);
  return true;
}

function sendToSocket(){}

function getDataUser(user_id){}

function update(){
  if(index_test < tableau_data.length){
    sendBroadcast("classement-update", tableau_data[index_test]);
  }else{
    index_test = 0;
  }
  index_test ++ ;
}

var intervallUpdate = setInterval(function(){
  update();
}
,timeIntervalUpdate);
