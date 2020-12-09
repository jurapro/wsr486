function random(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //Максимум и минимум включаются
}

class Drawable {
    //Базовые параметры всех объектов
    constructor(game) {
        this.game = game;
        this.$element = this.createElement();
        this.position = {
            x: 0,
            y: 0,
        };
        this.size = {
            w: 0,
            h: 0,
        };
        this.offsets = {
            x: 0,
            y: 0,
        }
        this.speedPerFrame = 0;
    }

    //Создание html элемента
    createElement() {
        return $(`<div class="element ${this.constructor.name.toLowerCase()}"></div>`);
    }

    //Обновление координат элемента
    update() {
        this.position.x += this.offsets.x;
        this.position.y += this.offsets.y;
    }

    //Применение изменений в css
    draw() {
        this.$element.css({
            left: this.position.x + 'px',
            top: this.position.y + 'px',
            width: this.size.w + 'px',
            height: this.size.h + 'px',
        })
    }

    //Проверка на столкновение с другим объектом
    isCollision(element) {
        let a = {
            x1: this.position.x,
            x2: this.position.x + this.size.w,
            y1: this.position.y,
            y2: this.position.y + this.size.h
        }
        let b = {
            x1: element.position.x,
            x2: element.position.x + element.size.w,
            y1: element.position.y,
            y2: element.position.y + element.size.h
        }
        return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2
    }

    //Проверка столкновения с левым краем
    isLeftBorderCollision() {
        return this.position.x < this.speedPerFrame;
    }

    //Проверка столкновения с правым краем
    isRightBorderCollision() {
        return this.position.x + this.size.w + this.speedPerFrame > this.game.$zone.width();
    }

    //Проверка столкновения с потолком
    isTopBorderCollision() {
        return this.position.y < this.speedPerFrame && this.offsets.y < 0;
    }

    //Проверка столкновения с полом
    isButtonBorderCollision() {
        return this.position.y + this.speedPerFrame > this.game.$zone.height() && this.offsets.y > 0
    }
}

class Player extends Drawable {
    //Начальные параметры игрока
    constructor(game) {
        super(game);
        this.size = {
            w: 200,
            h: 50,
        };
        this.position = {
            x: this.game.$zone.width() / 2 - this.size.w / 2,
            y: this.game.$zone.height() - this.size.h,
        };
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
        };
        this.speedPerFrame = 10;
        this.bindKeyEvents();
    }

    //Назначение обработчиков нажатия клавиш
    bindKeyEvents() {
        document.addEventListener('keydown', ev => this.changeKeyStatus(ev.code, true));
        document.addEventListener('keyup', ev => this.changeKeyStatus(ev.code, false));
    }

    //Смена состояния нажатой клавиши
    changeKeyStatus(code, value) {
        if (code in this.keys) {
            this.keys[code] = value;
        }
    }

    update() {

        switch (true) {
            case this.keys.ArrowLeft:
                if (this.isLeftBorderCollision()) {
                    this.position.x = 0;
                    break;
                }
                this.position.x -= this.speedPerFrame;
                break;
            case this.keys.ArrowRight:
                if (this.isRightBorderCollision()) {
                    this.position.x = this.game.$zone.width() - this.size.w;
                    break;
                }
                this.position.x += this.speedPerFrame;
                break;
        }
    }

}

class Ball extends Drawable {
    //Начальные параметры мяча
    constructor(game) {
        super(game);
        this.size = {
            w: 50,
            h: 50,
        };
        this.position = {
            x: this.game.$zone.width() / 2 - this.size.w / 2,
            y: 0,
        };
        this.speedPerFrame = 10;
        this.offsets.y = this.speedPerFrame;
        this.bindEvents();
    }

    update() {
        if (this.isCollision(this.game.player)) {
            this.changeDirection();
            //Вызов события столкновения с ракеткой
            document.dispatchEvent(new CustomEvent('player-collision'));
        }
        if (this.isTopBorderCollision()) {
            this.changeDirection();
        }
        if (this.isLeftBorderCollision() || this.isRightBorderCollision()) {
            this.changeDirectionX();
        }
        if (this.isButtonBorderCollision()) {
            //Событие падения мяча
            document.dispatchEvent(new CustomEvent('missed-ball'));
        }
        super.update();
    }

    //Прослушивание событий игры
    bindEvents() {
        document.addEventListener('block-collision', this.changeDirection.bind(this));
    }

    changeDirectionY() {
        this.offsets.y *= -1;
    }

    changeDirectionX() {
        this.offsets.x *= -1;
    }

    changeDirection() {
        if (random(0, 1)) {
            this.changeDirectionY();
        } else {
            this.changeDirectionY();
            this.offsets.x = random(-5, 5);
        }
    }
}

class Block extends Drawable {
    constructor(game) {
        super(game);
        this.size = {
            h: 50,
            w: 200
        }
    }

    update() {
        if (this.isCollision(this.game.ball)) {
            //Вызов события столкновения
            document.dispatchEvent(new CustomEvent(
                'block-collision', {
                    detail: {element: this}
                }
            ));
            this.$element.remove();
        }
        super.update();
    }
}

class Game {
    //Базовые настройки игры
    constructor() {
        this.$zone = $('#game .elements');
        this.$panel = $('#game .panel');
        this.options = {
            score: 0,
            scoreRate: 0,
            pause: false,
            timer: {
                second: 50,
                tik: 0
            }
        }
        this.keys = {
            Escape: false,
        };
        this.elements = [];
        this.player = this.generate(Player);
        this.ball = this.generate(Ball);
        this.blocksGenerate(4);
        this.bindEvents();
    }

    //Генерация элемента
    generate(ClassName) {
        let element = new ClassName(this);
        this.elements.push(element);
        this.$zone.append(element.$element);
        return element;
    }

    //Генерация одного блока
    blockGenerate(position) {
        let block = this.generate(Block);
        block.position = position;
        return block;
    }

    //Генерация набора блоков
    blocksGenerate(rows) {
        let {w: blockW, h: blockH} = (new Block).size;

        for (let y = 1; y <= rows; y++) {
            for (let x = 50; x < this.$zone.width() - blockW; x += blockW + 50) {
                let position = {x: x, y: y * (blockH + 50)};
                this.blockGenerate(position);
            }
        }
    }

    //Прослушивание событий игры
    bindEvents() {
        document.addEventListener('keyup', ev => this.changeKeyStatus(ev.code));
        document.addEventListener('block-collision', this.blockCollision.bind(this));
        document.addEventListener('player-collision', this.playerCollision.bind(this));
        document.addEventListener('missed-ball', this.endGame.bind(this));
    }

    //Смена состояния нажатой клавиши
    changeKeyStatus(code) {
        if (code in this.keys) {
            this.keys[code] = !this.keys[code];
        }
    }

    //Обработчик события block-collision
    blockCollision(event) {
        this.options.score += this.options.scoreRate + 1;

        this.options.scoreRate++;
        let element = event.detail.element;
        this.removeElement(element);
    }

    //Обработчик события player-collision
    playerCollision() {
        this.options.scoreRate = 0;
    }

    //Удаление элемента
    removeElement(element) {

        let ind = this.elements.indexOf(element);
        if (ind === -1) return false;
        return this.elements.splice(ind, 1);
    }

    //Старт игры
    start() {
        this.loop();
    }

    //Бесконечный игровой цикл
    loop() {
        requestAnimationFrame(() => {
            if (!this.options.pause) {
                this.updateElements();
                this.updateGame();
            }
            this.updatePause();
            this.loop();
        })
    }

    //Обновление всех элементов
    updateElements() {
        this.elements.forEach(element => {
            element.update();
            element.draw();
        })
    }

    //Обновление состояния игры
    updateGame() {
        this.updateTime();
        this.updatePanel();
    }

    //Отслеживание паузы
    updatePause() {
        this.options.pause = this.keys.Escape;
        if (this.options.pause) {
            this.$panel.addClass('pause');
        } else {
            this.$panel.removeClass('pause');
        }
    }

    //Обновление времени
    updateTime() {
        this.options.timer.tik++;
        if (this.options.timer.tik === 60) {
            this.options.timer.tik = 0;
            this.options.timer.second++;
        }
    }

    //Отрисовка параметров на верхней панели
    updatePanel() {
        this.$panel.html(`
            <span class="score">Очки: ${this.options.score}</span>
            <span class="timer">Таймер: ${this.getFormattedTime().min}:${this.getFormattedTime().sec}</span>`);
    }

    //Форматирование времени
    getFormattedTime() {
        let min = Math.floor(this.options.timer.second / 60);
        min = (min < 10) ? '0' + min : min;
        let sec = this.options.timer.second % 60;
        sec = (sec < 10) ? '0' + sec : sec;

        return {
            min: min,
            sec: sec
        };
    }

    //Функция окончания игры
    endGame() {
        this.keys.Escape = true;
        //alert('Вы проиграли');
    }
}

const game = new Game();
game.start();