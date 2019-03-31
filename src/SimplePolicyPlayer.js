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

class NNModel {
  constructor(learning_rate = 0.01){
    this.learning_rate = learning_rate
    this.model = this.createModel()
  }

  train(actions, rewards, boards) {
    // const logits = tf.tidy(() => this.model.predict(tf.tensor(boards)))
    // const crossEntropies = tf.losses.softmaxCrossEntropy(tf.oneHot(actions, BOARD_SIZE), logits)
    // crossEntropies.print()
    // const loss = tf.sum(tf.tensor(rewards).mul(crossEntropies))

    const optimizer = tf.train.rmsprop(this.learning_rate, 0.99)
 
    optimizer.minimize(() => {
      const oneHotLabels = tf.oneHot(actions, BOARD_SIZE).dataSync()
      const logits = this.model.predict(tf.tensor(boards)).dataSync()
      const crossEntropies = tf.losses.softmaxCrossEntropy(oneHotLabels, logits)
      const loss = tf.tensor(rewards).mul(crossEntropies)
      return loss
    })
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

export default class SimplePolicyPlayer {
  constructor(winValue = 1.0, drawValue = 0.0, lossValue = -1.0    ) {
    this.NN = new NNModel()
    this.winValue = winValue,
    this.drawValue = drawValue,
    this.lossValue = lossValue
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
      const logits = this.NN.model.predict(tf.tensor([nnInput]))
      for (let i = 0; i < logits.length; i++) {
        if(!board.isLegal(i)){
          logits[i] = -1
        }
      }

      let move
      while(!board.isLegal(move)) {
        move = tf.multinomial(logits, 1).dataSync()[0]
      }
      return move
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

  finalResult(result) {
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

    const rewards = []
    this.actions.forEach(()=>{
      rewards.push(reward)
      reward = reward / 2
    })
    rewards.reverse()
    this.NN.train(this.actions, rewards, this.boards)
    return null
  }
}