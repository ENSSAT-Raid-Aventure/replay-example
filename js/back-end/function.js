module.exports.get_customGeometryJSON = function (json, property,index){
  if(!index)
    index = 0;
  switch(property){
    case "coordinates":
      return json[index].geometry.coordinates;
    case "properties":
      return json[index].geometry.properties;
    case "equipe":
      return json[index].geometry.properties.equipe;
    case "time":
      return json[index].geometry.properties.time;
    case "title":
      return json[index].geometry.properties.title;
    case "teammates":
      return json[index].geometry.properties.teammates;
  }
}
function cliAddress(req) {
  return req.connection.remoteAddress || req.socket.remoteAddress || req.headers['x-forwarded-for'];
}

module.exports.isLocal = function (server, request) {
  return server.address() === cliAddress(request);
}
