/**
 *
 */

/**
 *
 */
function resourceManager(){};

resourceManager.prototype = {
	ctx: null,
	resData: [],
	numRes: 0,
	numLoadedRes: 0,
	collectable: null,
	pushable: null,
	init: function(cId, res, onld, clbl, psbl) {
		var canvas = document.getElementById(cId);
		if (canvas.getContext) {
			this.ctx = canvas.getContext("2d");

			for (r in res) {
				this.resData[r] = new Image();
				this.resData[r].onload = onld; 
				this.resData[r].src = res[r];
				this.numRes++;
			}
		}
		this.collectable = clbl;
		this.pushable = psbl;
	},
	isDataReady: function() {
		return (this.numRes == this.numLoadedRes);
	},
	getLoadPercent: function() {
		return (this.numLoadedRes * 100 / this.numRes);
	},
	getResource: function(id) {
		if (id in this.resData) {
			return this.resData[id];
		}
		return null;
	}
};

/**
 *
 */
function levelObj(){};

levelObj.prototype = {
	data: null,
	w: 0,
	h: 0,
	init: function(dimX, dimY) {
		if (dimY < 10 || dimX < 20) {
			throw "E: Wrong level dimensions: "+dimX+":"+dimY;
		}
		this.w = dimX;
		this.h = dimY;

		this.data = this.makeEmpty(dimX, dimY);
		this.randomize();
	},
	makeEmpty: function(w, h) {
		var arr = new Array();
		var x, y = 0;

		for (y = 0; y < h; y++) {
			arr[y] = new Array();
			for (x = 0; x < w; x++) {
				if (y > 2) {
					arr[y][x] = "#";
				} else {
					arr[y][x] = " ";
				}
			}
		}
		arr[2][0] = "P";

		return arr;
	},
	randomize: function() {
		var x, y, i, cnt = 0;
		var numTiles = this.w * (this.h - 3);

		// Place 3% boulders
		this.randomTile("@", 3);

		// Place 6% jewels
		this.randomTile(">", 3);
		this.randomTile("<", 3);
	},
	randomTile: function(tile, percent) {
		var x, y, i = 0;
		var numTiles = this.w * (this.h - 3);
		var cnt = numTiles * percent / 100;

		while (i < cnt) {
			x = Math.floor(Math.random() * this.w);
			y = Math.floor(Math.random() * this.h);

			if (y > 3) {
				if (this.data[y][x] == " " || this.data[y][x] == "#") {
					this.data[y][x] = tile;
					i++;
				}
			}
		}
	}
};

/**
 * 
 */
function playerObj(){};

playerObj.prototype = {
	score: 0,
	money: 0,
	x: 0,
	y: 2
};

/**
 *
 */
function worldObj(){};

worldObj.prototype = {
	player: null,
	level: null,
	init: function() {
		this.player = new playerObj();
		this.level  = new levelObj();
		this.level.init(50, 20);
	},
	moveTo: function(dx, dy, push) {
		var tile = null;

		this.level.data[this.player.y][this.player.x] = " ";
		this.player.x += dx;
		this.player.y += dy;

		tile = this.level.data[this.player.y][this.player.x];
		this.level.data[this.player.y][this.player.x] = "P";
		if (push) {
			this.level.data[this.player.y + dy][this.player.x + dx] = tile;
		}
	},
	canMoveTo: function(dx, dy) {
		var minX = 0;
		var maxX = this.level.w - 1;

		var minY = 2;
		var maxY = this.level.h - 1;

		var newX = this.player.x + dx;
		var newY = this.player.y + dy;

		if (newX >= minX && newX <= maxX) {
			if (newY >= minY && newY <= maxY) {
				return this.level.data[newY][newX];
			}
		}
		return null;
	},
	getViewWin: function(width, height) {
		var win = new Array(0, 0);

		var minX = 0;
		var maxX = this.level.w - 1;

		var minY = 0;
		var maxY = this.level.h - 1;

		var plX = this.player.x;
		var plY = this.player.y;

		if (plX < Math.floor(width / 2)) {
			win[0] = minX;
		} else if ((maxX - plX) < Math.floor(width / 2)) {
			win[0] = maxX - width + 1;
		} else {
			win[0] = plX - Math.floor(width / 2);
		}

		if (plY < Math.floor(height / 2)) {
			win[1] = minY;
		} else if ((maxY - plY) < Math.floor(height / 2)) {
			win[1] = maxY - height + 1;
		} else {
			win[1] = plY - Math.floor(height / 2);
		}

		return win;
	}
};

/**
 *
 */
function gameObj(){};

gameObj.prototype = {
	ctx: null,
	res: null,
	world: null,
	init: function(resMng, kdEvt) {
		this.world = new worldObj();
		this.ctx = resMng.ctx;
		this.res = resMng;

		if (this.ctx != null) {
			this.world.init();
			this.drawFrame();
			window.addEventListener('keydown', kdEvt, true);
		}
	},
	drawFrame: function() {
		var viewW = 20;
		var viewH = 12;

		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, 640, 384);

		var pos = this.world.getViewWin(viewW, viewH);
		for (var i = pos[0]; i < pos[0] + viewW; i++) {
			for (var j = pos[1]; j < pos[1] + viewH; j++) {
				tile = this.res.getResource(this.world.level.data[j][i]);
				if (tile != null)
					this.ctx.drawImage(tile, (i - pos[0])*32, (j - pos[1])*32);
			}
		}
	},
	moveChar: function(dx, dy) {
		var tile = this.world.canMoveTo(dx, dy);
		var push = false;

		if (tile) {
			if (tile in this.res.pushable) {
				if (dy == 0) {
					var tile2 = this.world.canMoveTo(dx * 2, dy * 2);
					if (tile2) {
						if (tile2 != " ")
							return;
						push = true;
					} else
						return;
				} else
					return;
			}
			// TODO: check for collectable

			this.world.moveTo(dx, dy, push);
			this.drawFrame();
		}
	}
};

/**
 *
 */
function game(cId) {
	var gameRes = new Array();

	gameRes["#"] = "img/block1.png";
	gameRes["P"] = "img/player.png";
	gameRes["<"] = "img/jewel1.png";
	gameRes[">"] = "img/jewel2.png";
	gameRes["@"] = "img/boulder1.png";

	resMngr.init(cId, gameRes, resOnLoad, {"<": "", ">": ""}, {"@": ""});
}

/**
 *
 */
function doKeyDown(evt){
	if (evt.keyCode == 40) {
		// down
		theGame.moveChar(0, +1);
	}
	if (evt.keyCode == 38) {
		// up
		theGame.moveChar(0, -1);
	}
	if (evt.keyCode == 37) {
		// left
		theGame.moveChar(-1, 0);
	}
	if (evt.keyCode == 39) {
		// right
		theGame.moveChar(+1, 0);
	}
}

/**
 *
 */
function resOnLoad() {
	resMngr.numLoadedRes++;
	if (resMngr.isDataReady()) {
		theGame.init(resMngr, doKeyDown);
	}
}

/**
 *
 */
var resMngr = new resourceManager();
var theGame = new gameObj();
