document.addEventListener('DOMContentLoaded', () => {
    let gameField = document.querySelector('.grid')
    let width = 15
    fillGameField(width)
    let boxes = document.querySelectorAll('.grid div')
    let scoreDisplay = document.querySelector('span')
    let startButton = document.querySelector('.start')
    let pauseButton = document.querySelector('.pause')

    let appleIndex = 0
    let snake = [2, 1, 0]
    let isLost = false
    let isPause = false
    let direction = 1
    let score = 0
    
    let fpsInterval, now, then, elapsed;

    function start(){
        isLost = false
        isPause = false
        score = 0
        scoreDisplay.textContent = score
        pauseButton.textContent = 'Pause'
        direction = 1
        fpsInterval = 200
        snake.forEach(index => boxes[index].classList.remove('snake'))
        snake = [2, 1, 0]
        snake.forEach(index => boxes[index].classList.add('snake'))

        boxes[appleIndex].classList.remove('apple')
        generateApple()
        startAnimating()
        
    }

    // checks and makes moves
    function snakeMoves(){

        if (!isLost && !isPause){
            // boreders and snake itself check
            if (
                (snake[0] + width >= (width * width) && direction === width ) || //if snake hits bottom
                (snake[0] % width === width -1 && direction === 1) || //if snake hits right wall
                (snake[0] % width === 0 && direction === -1) || //if snake hits left wall
                (snake[0] - width < 0 && direction === -width) ||  //if snake hits the top
                boxes[snake[0] + direction].classList.contains('snake') //if snake goes into itself
              ) {
                isLost = true
                return 
              }

            //   making move
              let snakeTail = snake.pop()
              boxes[snakeTail].classList.remove('snake')
              snake.unshift(snake[0] + direction)
              
            //   cheking for apple
              if(boxes[snake[0]].classList.contains('apple')){
                  boxes[snake[0]].classList.remove('apple')
                  boxes[snakeTail].classList.add('snake')
                  snake.push(snakeTail)
                  generateApple()
                  score++
                  scoreDisplay.textContent = score
                  if (score % 5 == 0 && score != 0 && fpsInterval != 50){
                      fpsInterval -= 25
                  }
              }
              boxes[snake[0]].classList.add('snake')
        }
    }

    // makes animetion
    function startAnimating() {
        then = Date.now();
        startTime = then;
        animate();
    }

    function animate() {        
        requestAnimationFrame(animate);
        now = Date.now();
        elapsed = now - then;
        if (elapsed > fpsInterval) {
            then = now - (elapsed % fpsInterval);
            snakeMoves()
        }
    }

    // creats new apple
    function generateApple(){
        do{
            appleIndex =Math.floor(Math.random() * boxes.length)
        }while(boxes[appleIndex].classList.contains('snake'))
        boxes[appleIndex].classList.add('apple')
    }

    // creats game field
    function fillGameField(width){
        for (let i = 1; i <= width * width; i++){
            let box = document.createElement('div')
            if (i % 2 == 1){
                box.className = 'green'
            }
            gameField.append(box)
        }
    }

    // check for direction
    function controller(e){

        if (e.key == 'ArrowRight' && direction != -1){
            direction = 1
        }else if(e.key == 'ArrowLeft' && direction != 1){
            direction = -1
        }else if(e.key == 'ArrowUp' && direction != width){
            direction = -width
        }else if(e.key == 'ArrowDown' && direction != -width){
            direction = width
        }
    }

    // event listeners
    document.addEventListener('keyup', controller)
    startButton.addEventListener('click', start)
    pauseButton.addEventListener('click', () => {
        if (!isPause){
            isPause = true
            pauseButton.textContent = 'Continue'
        }else{
            isPause = false
            pauseButton.textContent = 'Pause'
        }
    })
})