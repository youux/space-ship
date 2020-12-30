const DEV_MODE = false

const stage = document.createElement('canvas')
const ctx = stage.getContext('2d')
const dialogue = document.querySelector('.dialogue')
const startBtn = dialogue.querySelector('button')
const hud = document.querySelector('.score')
const scoreNode = hud.querySelector('.score span')

let ship
let lasers = []
let enemies = []
let playing = false
let gameStarted = false
let speedMultiplier
let enemySeedFrameInterval
let score = 0

// 创建随机数
const randomBetween = function (min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

// 计算分数
const calcScore = function (x) {
	return Math.floor((1 / x) * 500)
}

// 创建飞船
const Ship = function (options) {
	this.radius = 10
	this.x = options.x || stage.width * 0.5 - this.radius - 0.5
	this.y = options.y || stage.height - this.radius - 30
	this.width = this.radius * 2
	this.height = this.width
	this.color = options.color
	this.left = false
	this.right = false
	this.speed = 10
	this.active = true

	// 监控键盘事件
	document.addEventListener('keydown', this.onKeyDown.bind(this))
	document.addEventListener('keyup', this.onKeyUp.bind(this))
}

Ship.prototype.update = function (x) {
	this.x = x
	this.y = stage.height - this.radius - 30
}

Ship.prototype.draw = function () {
	ctx.save()

	if (DEV_MODE) {
		ctx.fillStyle = '#fc0'
		ctx.fillRect(this.x, this.y, this.width, this.width)
	}

	ctx.fillStyle = this.color
	ctx.fillRect(this.x + this.radius - 5, this.y, 10, this.radius)
	ctx.fillRect(this.x, this.y + this.radius, this.width, 10)
	ctx.fillRect(this.x, this.y + this.radius + 10, 10, 5)
	ctx.fillRect(this.x + this.width - 10, this.y + this.radius + 10, 10, 5)

	ctx.restore()
}

// 飞船事件
Ship.prototype.onKeyDown = function (e) {
	if (ship.active) {
		if (e.keyCode === 39) this.right = true
		else if (e.keyCode === 37) this.left = true

		if (e.keyCode == 32) {
			const settings = {
				x: this.x + this.radius - 3,
				color: '#fc0'
			}
			const laser = new Laser(settings)
			lasers.push(laser)
		}
	}
}

Ship.prototype.onKeyUp = function (e) {
	if (e.key === 'ArrowRight') this.right = false
	else if (e.key === 'ArrowLeft') this.left = false
}

// 激光
const Laser = function (options) {
	this.x = options.x - 0.5
	this.y = options.y || stage.height - 50
	this.width = 6
	this.height = 20
	this.speed = 15
	this.color = options.color || '#fff'
	this.active = true
}

Laser.prototype.update = function (y) {
	this.y = y
}

Laser.prototype.draw = function () {
	ctx.save()
	ctx.fillStyle = this.color
	ctx.beginPath()
	ctx.rect(this.x, this.y, this.width, this.height)
	ctx.closePath()
	ctx.fill()
	ctx.restore()
}

// 创建圆点
const Enemy = function (options) {
	this.radius = randomBetween(10, 40)
	this.width = this.radius * 2
	this.height = this.width
	this.x = randomBetween(0, stage.width - this.width)
	this.y = -this.radius * 2
	this.color = options != undefined && options.color ? options.color : '#fff'
	this.speed = 2
	this.active = true
}

Enemy.prototype.update = function (x, y) {
	this.x = x
	this.y = y
}

Enemy.prototype.draw = function () {
	if (DEV_MODE) {
		ctx.fillStyle = 'skyblue'
		ctx.fillRect(this.x, this.y, this.width, this.width)
	}

	ctx.save()
	ctx.fillStyle = this.color
	ctx.beginPath()
	ctx.arc(
		this.x + this.radius,
		this.y + this.radius,
		this.radius,
		0,
		Math.PI * 2
	)
	ctx.closePath()
	ctx.fill()
	ctx.restore()
}

// 判断击中
const hitTest = function (item1, item2) {
	let collision = true
	if (
		item1.x > item2.x + item2.width ||
		item1.y > item2.y + item2.height ||
		item2.x > item1.x + item1.width ||
		item2.y > item1.y + item1.height
	) {
		collision = false
	}
	return collision
}

// 击中处理
const handleLaserCollision = function () {
	for (let enemy of enemies) {
		for (let laser of lasers) {
			let collision = hitTest(laser, enemy)
			if (collision && laser.active) {
				console.log('你消灭了一个敌人')
				enemy.active = false
				laser.active = false

				// 提高速度
				speedMultiplier += 0.025
				if (enemySeedFrameInterval > 20) {
					enemySeedFrameInterval -= 2
				}

				// 计算分数
				score += calcScore(enemy.radius)
				scoreNode.textContent = score
			}
		}
	}
}

// 飞船处理
const handleShipCollision = function () {
	if (enemies.length) {
		for (let enemy of enemies) {
			let collision = hitTest(ship, enemy)
			if (collision) {
				console.log('飞船被摧毁')
				ship.active = false
				setTimeout(() => {
					ship.active = true
					speedMultiplier = 1
					enemySeedFrameInterval = 100
					score = 0
					scoreNode.textContent = score
				}, 2000)
			}
		}
	}
}

// 构建飞船
const drawShip = function (xPosition) {
	if (ship.active) {
		ship.update(xPosition)
		ship.draw()
	}
}

// 构建圆点
const drawEnemies = function () {
	if (enemies.length) {
		for (let enemy of enemies) {
			if (enemy.active) {
				enemy.update(enemy.x, (enemy.y += enemy.speed * speedMultiplier))
				enemy.draw()
			}
		}
	}
}

// 清除圆点
const enemyCleanup = function () {
	if (enemies.length) {
		enemies = enemies.filter((enemy) => {
			let visible = enemy.y < stage.height + enemy.width
			let active = enemy.active === true
			return visible && active
		})
	}
}

// 构建激光
const drawLasers = function () {
	if (lasers.length) {
		for (let laser of lasers) {
			if (laser.active) {
				laser.update((laser.y -= laser.speed))
				laser.draw()
			}
		}
	}
}
// 清除激光
const laserCleanup = function () {
	lasers = lasers.filter((laser) => {
		let visible = laser.y > -laser.height
		let active = laser.active === true
		return visible && active
	})
}

let tick = 0

// 构建页面
const render = function (delta) {
	if (playing) {
		let xPos = ship.x

		// 增加新的敌人
		if (tick % enemySeedFrameInterval === 0 && ship.active) {
			const enemy = new Enemy()
			enemies.push(enemy)
		}

		// 背景
		ctx.save()
		ctx.fillStyle = '#000'
		ctx.fillRect(0, 0, stage.width, stage.height)
		ctx.restore()

		// 飞船移动
		if (ship.left) xPos = ship.x -= ship.speed
		else if (ship.right) xPos = ship.x += ship.speed

		// 边界
		if (gameStarted) {
			if (xPos < 0) xPos = 0
			else if (xPos > stage.width - ship.width) xPos = stage.width - ship.width
		}

		drawShip(xPos)

		handleShipCollision()
		handleLaserCollision()

		drawLasers()
		drawEnemies()

		enemyCleanup()
		laserCleanup()

		tick++
	}
	requestAnimationFrame(render)
}

// 启动游戏
const startGame = function (e) {
	console.log('开始游戏')
	dialogue.classList.add('dialogue--hidden')
	hud.classList.remove('score--hidden')
	e.currentTarget.blur()

	// 设置
	speedMultiplier = 1
	enemySeedFrameInterval = 100
	ship.x = stage.width * 0.5 - ship.radius - 0.5
	ship.y = stage.height - ship.radius - 30
	enemies = []
	gameStarted = true
}

// 重置浏览器大小
const onResize = function () {
	stage.width = window.innerWidth
	stage.height = window.innerHeight
}

// 点击开始游戏
startBtn.addEventListener('click', startGame)
// 监控浏览器大小
window.addEventListener('resize', onResize)

// canvas添加到body
document.body.appendChild(stage)
onResize()

// 启动
ship = new Ship({ color: '#ff9d00', x: -100, y: -100 })
playing = true
render()
