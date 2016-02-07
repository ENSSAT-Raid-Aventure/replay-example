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
var databaseCollectionTrace = "trace";
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
app.post("/api/add-user",function(req,res){
  console.log(req.connection.remoteAddress);
  console.log(function_js.isLocal(server,req));
  if(req.connection.remoteAddress == adresseIPAutoriséeAPI){
    var message_update = "";
    var user = JSON.parse(req.query.user);
    console.log(user);
    if(user == null)
      res.status(500).send("Erreur : aucun user renseigné")
    else{
      //on récupère la partie properties de la data, on vérifie que tout est renseigné

      if(user.dev_id == undefined || typeof user.dev_id !== "string")
        res.status(500).send("Erreur : aucun user.dev_id renseigné");
      else{
        if(user.time == undefined || !Array.isArray(user.time))
          user.time = [];
        if(user.test == undefined || typeof user.test !== "boolean")
          user.test = true;
        //Check for path_options
        //Check for team
        //Construction variable server
        var user_db = {
          geometry: {type : 'LineString', coordinates : [] },
          type : "Feature",
          properties : user
        }
        //on ajoute l'utilisateur à la base
        data.addData(databaseCollectionTrace, user_db, function(error, datas){
          if(error !== null){
            message_update = "Une erreur s'est produite, l'ajout en base de données n'as pas abouti.";
          }else{
            message_update = "L'utilisateur a bien été ajouté à la base de données.";
          }
        });
      }
    }
    res.status(200).send(message_update);
  }else{
    res.status(404).send("Impossible de trouver le contrôleur correspondant");
  }
});
//Appel du serveur qui récupère la data depuis les antennes
app.put("/api/update",function(req,res){
  var device_id = req.query.device_id;
  var new_position = req.query.new_position;
  if(device_id == undefined)
    res.status(500).send("Erreur : pas de device_id renseigné");
  if(new_position == undefined)
    res.status(500).send("Erreur : pas de new_position renseigné");
  var teamTag;
  data.findWhere(databaseCollectionTrace,{ "properties.dev_id" : device_id }, function(error,datas){
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
app.delete("/api/delete-user",function(req,res){
  var message_update = "";
  var id = req.query.id;
  if(id == null)
    res.status(500).send("Erreur : aucun user renseigné")
  else{
      //on ajoute l'utilisateur à la base
      data.removeManyData(databaseCollectionTrace, { "_id" : id }, function(error, datas){
        console.log(error)
        if(error !== null){
          message_update = "Une erreur s'est produite, la suppression en base de données n'as pas abouti.";
        }else{
          message_update = "L'utilisateur a bien été supprimé à la base de données.";
        }
        res.status(200).send(message_update);
      });
  }
});
app.get("/api/get-all-user", function(req,res){
  data.findWhere(databaseCollectionTrace,{}, function(error, datas){
    res.send(datas);
  })
});
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
