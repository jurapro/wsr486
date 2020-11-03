class Drawble {
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
        let $element = $(`<div class="element ${this.constructor.name.toLowerCase()}"></div>`);
        this.game.$zone.append($element);
        return $element;
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
}

class Player extends Drawble {
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

class Ball extends Drawble {
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
    }

    update() {
        if (this.isCollision(this.game.player) || this.isTopBorderCollision()) {
            this.changeDirection();
        }
        super.update();
    }

    changeDirection() {
        this.offsets.y *= -1;
    }
}

class Game {
    //Базовые настройки игры
    constructor() {
        this.$zone = $('#game .elements');
        this.elements = [];
        this.player = this.generate(Player);
        this.ball = this.generate(Ball);
    }

    //Генерация элемента
    generate(ClassName) {
        let element = new ClassName(this);
        this.elements.push(element);
        return element;
    }

    //Старт игры
    start() {
        this.loop();
    }

    //Бесконечный игровой цикл
    loop() {
        requestAnimationFrame(() => {
            this.updateElements();
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
}

const game = new Game();
game.start();