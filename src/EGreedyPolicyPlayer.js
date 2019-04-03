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
  constructor(learning_rate = 0.001){
    this.learning_rate = learning_rate
    this.model = this.createModel()
  }

  train(actions, rewards, boards) {
    const optimizer = tf.train.rmsprop(this.learning_rate, 0.99)
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

export default class EGreedyPolicyPlayer {
  constructor(winValue = 1.0, drawValue = 0.5, lossValue = 0, random_move_prob = 0.99, random_move_decrease = 0.99 ) {
    this.NN = new NNModel()
    this.winValue = winValue
    this.drawValue = drawValue
    this.lossValue = lossValue
    this.random_move_prob = random_move_prob
    this.random_move_decrease = random_move_decrease
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
      let logits = this.NN.model.predict(tf.tensor([nnInput]))
      const probs = tf.softmax(logits).dataSync()
      logits = logits.dataSync()

      for (let i = 0; i < logits.length; i++) {
        if(!board.isLegal(i)){
          probs[i] = -1
        }
      }

      let move
      if(Math.random() < this.random_move_prob) {
        move = board.randomEmptySpot()
      } else {
        move = tf.argMax(probs).dataSync()[0]
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
      reward = reward * 0.95
    })
    rewards.reverse()
    this.NN.train(this.actions, rewards, this.boards)
    this.random_move_prob *= this.random_move_decrease
    console.log(this.random_move_prob)
    return null
  }
}