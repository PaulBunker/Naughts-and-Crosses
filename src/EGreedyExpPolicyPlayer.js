import * as tf from '@tensorflow/tfjs-node'
import { BOARD_SIZE, GAME_RESULT, EMPTY, NAUGHT, CROSS} from './constants'

const otherSide = (side) => {
  switch(side) {
  case NAUGHT:
    return CROSS
  case CROSS:
    return NAUGHT
  default:
    throw `${side} is not a valid side`
  }
}

function getRandom(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len)
  if (n > len)
    throw new RangeError('getRandom: more elements taken than available')
  while (n--) {
    var x = Math.floor(Math.random() * len)
    result[n] = arr[x in taken ? taken[x] : x]
    taken[x] = --len in taken ? taken[len] : len
  }
  return result
}

class ReplayBuffer {
  constructor(buffer_size=1000) {
    this.buffer_size = buffer_size
    this.buffer = []
  }

  add(experience){
    if (this.buffer.length + experience.length >= this.buffer_size){
      this.buffer.shift()
    }
    this.buffer.push(experience)
  }

  sample(size){
    const minSize = Math.min(this.buffer.length, size)
    return getRandom(this.buffer, minSize)
  }
}

class NNModel {
  constructor(learning_rate = 0.001){
    this.learning_rate = learning_rate
    this.model = this.createModel()
  }

  train(actions, rewards, boards) {
    const optimizer = tf.train.adam(this.learning_rate, 0.99)
    const oneHotLabels = tf.oneHot(actions, BOARD_SIZE)
    const loss = optimizer.minimize(() => {
      return tf.tidy(() => {
        const logits = this.model.predict(tf.tensor(boards))
        const crossEntropies = tf.losses.softmaxCrossEntropy(oneHotLabels, logits)
        const loss = tf.sum(tf.tensor(rewards).mul(crossEntropies))
        return loss
      })
    }, true)
    loss.print()
    return
  }

  createModel() {
    const model = tf.sequential()

    model.add(
      tf.layers.dense({
        units: BOARD_SIZE * 3 * 9,
        activation: 'relu',
        inputShape: [BOARD_SIZE * 3]
      })
    )

    model.add(
      tf.layers.dense({
        units: BOARD_SIZE,
      })  
    )

    return model
  }
}

export default class EGreedyExpPolicyPlayer {
  constructor(
    preTrainingGames = 500, 
    winValue = 1, 
    drawValue = 0.5, 
    lossValue = 0, 
    batchSize = 50, 
  ) {
    this.NN = new NNModel()
    this.winValue = winValue
    this.drawValue = drawValue
    this.lossValue = lossValue
    this.replay_buffer_win = new ReplayBuffer()
    this.replay_buffer_loss = new ReplayBuffer()
    this.replay_buffer_draw = new ReplayBuffer()
    this.gameCounter = 0
    this.preTrainingGames = preTrainingGames
    this.batchSize = batchSize
  }

  newGame(side) {
    this.side = side
    this.actions = []
    this.boards = []
  }

  boardToNNInput(state){
    return [
      ...state.map((space) => space === this.side ? 1 : 0 ),
      ...state.map((space) => space === otherSide(this.side) ? 1 : 0 ),
      ...state.map((space) => space === EMPTY ? 1 : 0 ),
    ]
  }

  getLegalMove(nnInput, board) {
    return tf.tidy(() => {
      const logits = this.NN.model.predict(tf.tensor([nnInput])).dataSync().filter((e,i) => board.isLegal(i))


      if(this.gameCounter < this.preTrainingGames) {
        return board.randomEmptySpot()
      } else {
        let index = logits.length === 1 ? 0 : tf.multinomial(tf.tensor(logits), 1).dataSync()[0]
        for (let i = 0; i < 9; i++) {
          if(board.state[i] === EMPTY){
            if (index === 0){
              return i
            } else {
              index--
            }
          }
        }
      }
    })
  }

  move(board) {
    const nnInput = this.boardToNNInput(board.state)
    const move = this.getLegalMove(nnInput, board)
    const [ _, res, finished ] = board.move(move, this.side)
    this.boards.push(nnInput)
    this.actions.push(move)
    return [ res, finished ]
  }

  addGameToReplayBuffer(reward){
    let buffer
    switch (reward) {
    case this.winValue:
      buffer = this.replay_buffer_win
      break
    case this.lossValue:
      buffer = this.replay_buffer_loss
      break
    case this.drawValue:
      buffer = this.replay_buffer_draw
      break
    default:
      throw('oops')
    }
    //TODO this is inefficient 
    const rewards = []
    this.actions.forEach(()=>{
      rewards.push(reward)
      reward = reward * 0.95
    })
    rewards.reverse()

    this.actions.forEach((a, i) => {
      buffer.add([a, rewards[i], this.boards[i]])      
    })
  }

  getTrainingBatch() {
    const batchThird = Math.floor(this.batchSize/3)
    const trainBatch = [
      ...this.replay_buffer_win.sample(batchThird),
      ...this.replay_buffer_loss.sample(batchThird),
      ...this.replay_buffer_draw.sample(batchThird),
    ]
    const actions = []
    const boards = []
    const rewards = []

    trainBatch.forEach(([a,r,b])=>{
      actions.push(a)
      rewards.push(r)
      boards.push(b)
    })

    return [actions, rewards, boards]

  }

  finalResult(result) {
    this.gameCounter += 1
    console.log(this.gameCounter)
    let reward
    if(
      (result === GAME_RESULT.NAUGHT_WIN && this.side === NAUGHT) ||
      (result === GAME_RESULT.CROSS_WIN && this.side === CROSS)
    ){
      reward = this.winValue
    } else if (
      (result === GAME_RESULT.NAUGHT_WIN && this.side === CROSS) ||
      (result === GAME_RESULT.CROSS_WIN && this.side === NAUGHT)
    ) {
      reward = this.lossValue
    } else if (result === GAME_RESULT.DRAW) {
      reward = this.drawValue
    }
    this.addGameToReplayBuffer(reward)

    if(this.gameCounter > this.preTrainingGames) {
      const [actions, rewards, boards] = this.getTrainingBatch()
      this.NN.train(actions, rewards, boards)
    }

    return null
  }
}