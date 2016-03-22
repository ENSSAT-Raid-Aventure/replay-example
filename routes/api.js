module.exports = function (app) {
  var confirme = "confirme";
  var debutant = "debutant";
  var kayak = "kayak";
  var velo = "vtt";
  var running = "trail";
  var circuits = [];
  var databaseCollectionTrace = "trace";
  var databaseCollectionCircuit = "circuit";
  var last_time_teams;
  //Temps entre chaque mise à jour côté client
  var timelaps = 1000;
  var attenteDepart = 60000;
  var point_depart;

  //Initialisation

  // Circuits
  data.findWhere(databaseCollectionCircuit,{}, function(error, datas){
    if(!error){
      circuits = datas;
      point_depart = _.find(circuits, function(circuit){ return circuit.properties.part == kayak && circuit.properties.type == confirme}).geometry.coordinates[0];
    }
  });

  //Timer update
  data.findWhere(databaseCollectionTrace,{}, function(error, datas){
    if(error != null)
    {
      last_time_teams = _.map(datas, function (team){
        var team_ =  {
          device_id : team.properties.dev_id,
          team : team.properties.team,
          time : [Now()],
          position : [point_depart],
          index : 0
        };
        return team;
      });
    }
  });

  //API Listener
  app.post("/api/add-user",function(req,res){
    if(req.connection.remoteAddress == adresseIPAutoriséeAPI){
      var message_update = "";
      var user = JSON.parse(req.query.user);
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

  app.put("/api/update",function(req,res){
    var device_id = req.query.device_id ? req.query.device_id : req.body.device_id;
    var new_position = req.query.new_position ? req.query.new_position : req.body.new_position;
    var time = req.query.time ? req.query.time : req.body.time;
    if(device_id == undefined)
      res.status(500).send("Erreur : pas de device_id renseigné");
    else if(new_position == undefined)
      res.status(500).send("Erreur : pas de new_position renseigné");
    else if(time == undefined)
      res.status(500).send("Erreur : pas de time renseigné");
    else{
      var teamTag;
      if(typeof new_position === "string")
        new_position = JSON.parse(new_position);
      data.findWhere(databaseCollectionTrace,{ "properties.dev_id" : device_id }, function(error,datas){
        if(error === null)
          if(datas.length === 0)
            res.status(500).send("Erreur : le device_id n'as pas été trouvée dans la base de données");
          else{
            var team = _.findWhere(last_time_teams, { device_id : device_id });
            if(team != undefined)
            {
              team.time.push(Now());
              var difference = team.time[team.time.length-1] - team.time[team.time.length-2];
              var last_lat_lng = team.position[team.position.length -1];
              var diff_lat = new_position[0] - last_lat_lng[0];
              var diff_lng = new_position[1] - last_lat_lng[1];
              for(var index = 0; index < difference / 1000; index ++){
                team.position.push([last_lat_lng[0] + (diff_lat/(difference/1000)) * index, last_lat_lng[1] + (diff_lng/(difference/1000)) * index]);
              }

            }
            //teamTag = datas[0].properties.team.name;
            //if(sendBroadcast("update-2",{team : teamTag, position : new_position, dev_id : device_id, time : time}) === true)
              res.sendStatus(200);
            //else
            //  res.status(500).send("Erreur : une erreur est survenue lors de l'envoi des données aux clients");
          }
        else
          res.status(500).send("Erreur : Une erreur s'est produite lors de la recherche en base de données");
      });
    }
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
  app.get("/api/start",function(){
    setTimeout(function(){
      for(var index = 0; index < last_time_teams.length; last_time_teams ++){
        var team_ = last_time_teams[index];
        team_.interval = setInterval(function(){
          if(team_.position[team_.index]){
            sendBroadcast("update",
            {
              team : team_.team,
              position : team_.position[team_.index],
              dev_id : team_.device_id
            });
            team_.index ++;
          }
        },timelaps)
      }
    },
    attenteDepart);
  });
  app.get("/api/get-all-user", function(req,res){
    data.findWhere(databaseCollectionTrace,{}, function(error, datas){
      res.status(200).send(datas);
    })
  });
  app.get("/api/teams",function(req,res){
    data.findWhere(databaseCollectionTrace,{}, function(error, datas){
      res.status(200).send(_.map(datas,function(data){
        return {
          dev_id : data.properties.dev_id,
          team : data.properties.team
        };
      }));
    });
  });
  app.get("/api/circuits/:confirme",function(req,res){
    if(req.params.confirme == "true"){
      data.findWhere(databaseCollectionCircuit,{"properties.type" : confirme}, function(error, datas){
        res.status(200).send(datas);
      });
    }
    else{
      data.findWhere(databaseCollectionCircuit,{"properties.type" : debutant}, function(error, datas){
        res.status(200).send(datas);
      });
    }
  });
  app.get("/api/circuit/kayak/:confirme",function(req,res){
    if(req.params.confirme == "true"){
      data.findWhere(databaseCollectionCircuit,{"properties.type" : (req.params.confirme ? confirme : debutant), "properties.part" : kayak}, function(error, datas){
        res.status(200).send(datas);
      });
    }
    else{
      data.findWhere(databaseCollectionCircuit,{ "properties.part" : kayak}, function(error, datas){
        res.status(200).send(datas);
      });
    }
  });
  app.get("/api/circuit/velo/:confirme",function(req,res){
    if(req.params.confirme == "true"){
      data.findWhere(databaseCollectionCircuit,{"properties.type" : (req.params.confirme ? confirme : debutant), "properties.part" : velo}, function(error, datas){
        res.status(200).send(datas);
      });
    }
    else{
      data.findWhere(databaseCollectionCircuit,{"properties.type" : velo}, function(error, datas){
        res.status(200).send(datas);
      });
    }
  });
  app.get("/api/circuit/running/:confirme",function(req,res){
    if(req.params.confirme == "true"){
      console.log("ouaaaais");
      data.findWhere(databaseCollectionCircuit,{"properties.type" : (req.params.confirme ? confirme : debutant), "properties.part" : running}, function(error, datas){
        res.status(200).send(datas);
      });
    }
    else{
      data.findWhere(databaseCollectionCircuit,{"properties.type" : running}, function(error, datas){
        res.status(200).send(datas);
      });
    }
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


  function setUpdateEngine(last_time_teams, device_id, time){
    var team = _.findWhere(last_time_teams, { device_id : device_id });
    if(team != undefined)
    {
      team.time.push(Now());
      if(team.timer.length != 0){

      }else{
        var difference = team.time[team.time.length-1] - team.time[team.time.length-2];
        team.timer = [setInterval(function(){

        }, timelaps)];

      }
    }
  }

  function Now(){
    return new Date().getTime();
  }
};
