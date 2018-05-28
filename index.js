var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
var count = 0
var mrt = {
  rnd: Math.floor(Math.random()*10)
}

var players = {};
var dirs = {};
var actions = {};
var clips = {}
var cnts = 0;
var tgh = 0;
//avoid duplicates
function inArray(arr, el) {
    for(var i = 0 ; i < arr.length; i++) 
            if(arr[i] == el) return true;
    return false;
}

function getRandomIntNoDuplicates(min, max, DuplicateArr) {
    var RandomInt = Math.floor(Math.random() * (max - min + 1)) + min;
    if (DuplicateArr.length > (max-min) ) return false;  // break endless recursion
    if(!inArray(DuplicateArr, RandomInt)) {
       DuplicateArr.push(RandomInt); 
       return RandomInt;
    }
    return getRandomIntNoDuplicates(min, max, DuplicateArr); //recurse
}
var duplicates  =[];
var rndnum = []

for (var i = 1; i <= 1 ; i++) { 
    //console.log(getRandomIntNoDuplicates(1,10,duplicates));
  rndnum.push(getRandomIntNoDuplicates(1,10,duplicates))
}
/////////////////
io.on('connection', function(socket) {
  
  socket.on('new player', function() {
    cnts += 1
    actions[socket.id] = {
      play: false
    }
    
    clips[socket.id] = {
      id: cnts,
      fps: 4,
      from: 1,
      to: 200
    }
    
       dirs[socket.id] = {
      disp: {x: 0, y: 0, z: 0},
      color: {r: Math.random()*1, g: Math.random()*1, b: Math.random()*1},
      rnd: cnts,
      cam: {x: 0, y: 0, z: 0},
      spawn: true,
      destroy: false,
      move: false,
      rotY: 0,
      lastpos: {x: 0, y: 5, z: 0},
      from: 1115,
      to: 2326,
      clip: "idle",
      play: false,
      threshold: 1,
      vel: 0
    }
    //limit the number of players available
    if(cnts == 20){
      dirs[socket.id].spawn = false;
    }
    
    
    players[socket.id] = {
      x: 0,
      y: 0,
      rnd: Math.floor(Math.random()*10),
      mesh: null,
      color: 'rgb(' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ',' + parseInt(Math.random() * 255) + ')'
    };
    
 
    
  });

  //remove players that are offline
   socket.on('disconnect', function(){
    var dir = dirs[socket.id] || {};

    dir.destroy = true

  })
  
  socket.on('changeActions', function(data) {
    var action = actions[socket.id] || {};
    action.play = data;
  })
  
  socket.on('playClip', function(data) {
    var clip = clips[socket.id] || {};
   if(data){
   clip.from = 320
     clip.to = 570
     clip.fps = 1
   }
  })
  
   socket.on('animations', function(data) {
    var dir = dirs[socket.id] || {};
    if(data.run){
      dir.play = true
      data.play = data.run;
      setTimeout(function(){
      data.run = false
      }, 3000)
     dir.clip = "jump"
    }
  })
  socket.on('getPosition', function(data) {
     var dir = dirs[socket.id] || {};
    dir.lastpos = data;
  })
   socket.on('locomotive', function(data) {
     var dir = dirs[socket.id] || {};
     dir.rotY = data.rotAxis
     dir.vel = data.velocity
   })
   socket.on('shift', function(data) {
      var dir = dirs[socket.id] || {};
     dir.disp = data;
   })
  
  socket.on('camera-follow', function(data) {
      var dir = dirs[socket.id] || {};
     dir.cam = data;
   })

  
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    var dir = dirs[socket.id] || {};
    if (data.left) {
      player.x -= 5;
      dir.x -= 5;
    }
    if (data.up) {
      dir.move = true
      player.y -= 5;
      dir.y -= 5;
    }
    if (data.right) {
      player.x += 5;
      dir.x += 5;
    }
    if (data.down) {
      dir.move = true
      player.y += 5;
      dir.y += 5;
    }
  });
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  })
   
});

setInterval(function(){


  io.sockets.emit('state', players);
    
  
}, 1000/60)

setInterval(function(){
  io.sockets.emit('anim', clips);
}, 1000)

// setInterval(function() {
 
//}, 1000 / 60);
setInterval(function() {
    io.sockets.emit('playAnimations', actions);
}, 4000);

setInterval(function() {
  
   io.sockets.emit('directions', dirs);
  io.sockets.emit('online', cnts);
  
}, 1000 / 60);


http.listen(port, function(){
  console.log('listening on *:' + port);
});
