module.exports = function (app) {
  var confirme = "confirme";
  var debutant = "debutant";
  var kayak = "kayak";
  var velo = "vtt";
  var running = "trail";
  var databaseCollectionTrace = "trace";
  var databaseCollectionCircuit = "circuit";
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
    var device_id = req.query.device_id;
    var new_position = req.query.new_position;
    var time = req.query.time;
    console.log(new_position);
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
        console.log("before mongodb");
      data.findWhere(databaseCollectionTrace,{ "properties.dev_id" : device_id }, function(error,datas){
        console.log("callback mongodb");
        if(error === null)
          if(datas.length === 0)
            res.status(500).send("Erreur : le device_id n'as pas été trouvée dans la base de données");
          else{
            teamTag = datas[0].properties.team.name;
          }
        else
          res.status(500).send("Erreur : Une erreur s'est produite lors de la recherche en base de données");
      }).then(function(){
        if(sendBroadcast("update-2",{team : teamTag, position : new_position, dev_id : device_id, time : time}) === true)
          res.sendStatus(200);
        else
          res.status(500).send("Erreur : une erreur est survenue lors de l'envoi des données aux clients");
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
};
