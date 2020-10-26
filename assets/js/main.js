class Game {
    //Базовые настройки игры
    constructor() {
        this.$zone = $('#game .elements');
        this.elements = [];
        this.player = this.generate(Player);
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