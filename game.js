/**
 * Created by Antonio on 23.05.2017.
 */
var ready = false;
var eurecaServer;
var player;
var players = {};
var myId;

Player = function (index, game, x, y) {
    this.cursor = {left:false, right:false, up:false, down:false};
    //this.count_of_colision = 0;
    this.game = game;
    this.id = index;
    this.sprite = game.add.sprite(x, y, 'phaser');
	this.sprite.player = this;
    //this.label_score = game.add.text(20, 20, "0", score_style);
    //this.sprite.addChild(this.label_score);
    this.game.physics.enable(this.sprite, Phaser.Physics.ARCADE);

};


//this function will handle client communication with the server
var eurecaClientSetup = function() {
    //create an instance of eureca.io client
    var eurecaClient = new Eureca.Client();


    eurecaClient.exports.updateState = function(id, cursor)
    {
        if (players[id])  {


            players[id].cursor = cursor;
        }
    };

   eurecaClient.ready(function (proxy) {		
		eurecaServer = proxy;
	});
	
	
	//methods defined under "exports" namespace become available in the server side
	
	eurecaClient.exports.setId = function(id) 
	{
		//create() is moved here to make sure nothing is created before uniq id assignation
		myId = id;
		create();
		eurecaServer.handshake(players[id].sprite.x, players[id].sprite.y);
		ready = true;
	};
	
	
	eurecaClient.exports.kill = function(id)
	{	
		if (players[id]) {
			players[id].kill();
			console.log('killing ', id, players[id]);
		}
	};
	
	eurecaClient.exports.spawnEnemy = function(i, x, y)
	{
		
		if (i == myId) return; //this is me
		
		console.log('SPAWN');
		var player = new Player(i, game, x, y);
		players[i] = player;
	}


};

var w = 800;
var h = 600;
var group;
var cursors;


var messange_style = {font: "50px Arial", fill: "red", align:"left", boundsAlignH: "top", boundsAlignV:"top"};
var score_style = {font: "20px Arial", fill: "red", align:"left", boundsAlignH: "top", boundsAlignV:"top"};
var vegetables = 80;
var chilli = 20;
var count_of_collision = 0;


Player.prototype.update = function() {
    if (!ready) return;

    if (this.id == myId) {
        var inputChanged = (
            this.cursor.left != cursors.left.isDown ||
            this.cursor.right != cursors.right.isDown ||
            this.cursor.up != cursors.up.isDown ||
            this.cursor.down != cursors.down.isDown
        );

        if (inputChanged) {
            this.cursor.left = cursors.left.isDown;
            this.cursor.right = cursors.right.isDown;
            this.cursor.up = cursors.up.isDown;
            this.cursor.down = cursors.down.isDown;
            eurecaServer.handleKeys(this.cursor);
        }
    }
    this.sprite.body.velocity.x = 0;
    this.sprite.body.velocity.y = 0;
    if(count_of_collision == chilli) {
        this.game.add.text(w/2 - 25, h/2 - 25, "Win!", messange_style);
        this.game.time.events.add(Phaser.Timer.SECOND * 4, Sleep, this);
    }
    if (this.cursor.left)
    {
        if(this.sprite.x < this.sprite.width / 2)
            this.sprite.x = w - this.sprite.width / 2;
        else
            this.sprite.body.velocity.x = -200;
    }
    else if (this.cursor.right)
    {
        if(this.sprite.x > w - this.sprite.width / 2)
            this.sprite.x = this.sprite.width / 2;
        else
            this.sprite.body.velocity.x = 200;
    }

    if (this.cursor.up)
    {
        if(this.sprite.y < this.sprite.height / 2)
            this.sprite.y = h - this.sprite.height / 2;
        else
            this.sprite.body.velocity.y = -200;
    }
    else if (this.cursor.down)
    {
        if(this.sprite.y > h - this.sprite.height / 2)
            this.sprite.y = this.sprite.height / 2;
        else
            this.sprite.body.velocity.y = 200;
    }

};

Player.prototype.kill = function() {
    this.sprite.kill();

};

Vegetable = function (game) {

    frame = game.rnd.between(0, 35);

    //  Just because we don't want a false chilli (frame 17)
    if (frame === 17)
    {
        frame = 1;
    }

    var x = game.rnd.between(0, w);
    var y = game.rnd.between(0, h);

    Phaser.Image.call(this, game, x, y, 'veggies', frame);

};

Vegetable.prototype = Object.create(Phaser.Image.prototype);
Vegetable.prototype.constructor = Vegetable;

Chilli = function (game) {

    var x = game.rnd.between(0, w);
    var y = game.rnd.between(0, h);

    Phaser.Sprite.call(this, game, x, y, 'veggies', 17);

    game.physics.arcade.enable(this);

};

Chilli.prototype = Object.create(Phaser.Sprite.prototype);
Chilli.prototype.constructor = Chilli;

//var game = new Phaser.Game(w, h, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update });

var game = new Phaser.Game(w, h, Phaser.AUTO, 'phaser-example', { preload: preload, create: eurecaClientSetup, update: update, render: render });


function preload() {

    game.load.image('phaser', 'assets/phaser-dude.png');
    game.load.spritesheet('veggies', 'assets/fruitnveg32wh37.png', 32, 32);
    game.load.image('background', 'assets/background.jpg');

}


function create() {

    game.canvas.style.cursor = 'none';
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.add.image(game.world.centerX, game.world.centerY, 'background').anchor.set(0.5);
    count_of_collision = 0;

    //  This example will check Sprite vs. Group collision

    group = game.add.group();

    for (var i = 0; i < vegetables; i++)
    {
        if (i < vegetables - chilli)
        {
            //  Vegetables don't have any physics bodies
            group.add(new Vegetable(game));
        }
        else
        {
            //  But a chilli has a physics body
            group.add(new Chilli(game));
        }
    }

    //  Our player
    var x = game.rnd.between(50, w - 50);
    var y = game.rnd.between(50, h - 50);
    var player1 = new Player(myId, game, x, y);
    //var player2 = new Player(1, game);
    players[myId] = player1;
    //players.push(player2);
    cursors = game.input.keyboard.createCursorKeys();
    game.stage.disableVisibilityChange = true;

}

function update() {

    if (!ready) return;
    for(var i in players)
    {
        game.physics.arcade.overlap(players[i].sprite, group, collisionHandler, null, this);
        players[i].update();
    }

}

function Sleep() {
    game.destroy();
}

function collisionHandler (sprite, chilli) {
    //  If the player collides with a chilli it gets eaten :)
    chilli.kill();
    //sprite.player.label_score.text = (parseInt(sprite.player.label_score.text, 10) + 1).toString();
    //sprite.player.count_of_collision += 1;
    count_of_collision += 1;
}

function render () {}
