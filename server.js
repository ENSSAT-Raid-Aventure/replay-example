//Déclaration des dépendances
var http = require('http');
var url = require('url');
var querystring = require('querystring');
var data = require('./js/back-end/data')
var app = require('express')();
var bodyParser = require('body-parser')
app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
var server = http.Server(app);
var io = require('socket.io').listen(server);
var _ = require('underscore');
var fs = require('fs');
var function_js = require('./js/back-end/function');


//Définition et initialisation variables serveur
var clients = [];
var timeIntervalUpdate = 1000;
var index_test = 0;
var jsonLeguer = undefined;
var url = "./exemple_carte/halage1.json";
var file = null;
var tableau_data = [];

fs.readFile(url,function(err,data){
  if(err) throw err;
  file = JSON.parse(data);
  tableau_data = function_js.get_customGeometryJSON(file,"coordinates");
});

data.findWhere("trace",{}, function(error, datas){
  if(error == null){
    for(var i = 0; i < datas.length; i ++){
      console.log(datas[i]);
    }
  }
  else{
    console.log(error);
  }
})

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

//Appel du serveur qui récupère la data depuis les antennes
app.post("/update",function(req,res){
  var device_id = req.query.device_id;
  var new_position = req.query.new_position;
  if(device_id == undefined)
    res.status(500).send("Erreur : pas de device_id renseigné");
  if(new_position == undefined)
    res.status(500).send("Erreur : pas de new_position renseigné");
  var teamTag;
  data.findWhere("trace",{ "properties.dev_id" : device_id }, function(error,datas){
    if(error === null)
      if(datas.length === 0)
        res.status(500).send("Erreur : le device_id n'as pas été trouvée dans la base de données");
      else
        teamTag = datas[0].properties.team.name;
    else
      res.status(500).send("Erreur : Une erreur s'est produite lors de la recherche en base de données");
  }).then(function(){
    if(sendBroadcast("update-2",{team : teamTag, position : req.query.new_position}) === true)
      res.sendStatus(200);
    else
      res.status(500).send("Erreur : une erreur est survenue lors de l'envoi des données aux clients");
  });
});

//
app.get("/first-coordinates",function(req,res){
  res.setHeader('Content-type','application/json');
  if(index_test > 0){
    res.send(JSON.stringify({
      data1 : tableau_data[index_test - 1],
      data2 : tableau_data[index_test]
    }));
  }
  else{
    res.send(JSON.stringify({
      data1 : tableau_data[index_test],
      data2 : tableau_data[index_test]
    }));
  }
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


function sendBroadcast(eventName, data){
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
