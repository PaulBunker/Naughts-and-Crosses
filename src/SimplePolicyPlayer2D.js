import * as tf from '@tensorflow/tfjs-node'
import { BOARD_SIZE, GAME_RESULT, EMPTY, NAUGHT, CROSS, BOARD_DIM} from './constants'

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
    console.log('train')
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

    // model.add(
    //   tf.layers.conv2d({
    //     kernelSize: [3,3],
    //     filters: 128,
    //     units: BOARD_SIZE * 3 * 9,
    //     activation: 'relu',
    //     inputShape: [BOARD_DIM, 3, 3]
    //   })
    // )

    model.add(tf.layers.conv2d({
      inputShape: [BOARD_DIM, 3, 3],
      kernelSize: [3,3],
      filters: 128,
      strides: 3,
      activation: 'relu',
      kernelInitializer: 'varianceScaling'
    }))
  
    // The MaxPooling layer acts as a sort of downsampling using max values
    // in a region instead of averaging.  
    model.add(tf.layers.maxPooling2d({poolSize: [3, 3], strides: [3, 3]}))
    // model.add(
    //   tf.layers.conv2d({
    //     kernelSize: [3,3],
    //     filters: 128,
    //     units: BOARD_SIZE * 3 * 9,
    //     activation: 'relu',
    //   })
    // )
    // model.add(
    //   tf.layers.conv2d({
    //     kernelSize: [3,3],
    //     filters: 64,
    //     units: BOARD_SIZE * 3 * 9,
    //     activation: 'relu',
    //   })
    // )
    model.add(
      tf.layers.dense({
        units: BOARD_SIZE * 3 * 9,
        activation: 'relu',
      })
    )
      
    model.add(tf.layers.flatten())
    model.add(
      tf.layers.dense({
        units: BOARD_SIZE,
      })  
    )

    return model
  }
}

export default class SimplePolicyPlayer {
  constructor(winValue = 1.0, drawValue = 0.5, lossValue = 0 ) {
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
    const nnState = [[],[],[]]
    const step1 = state.map((space) => tf.oneHot(space, 3).dataSync(0))
    step1.forEach(( space, i) => {
      nnState[Math.floor(i / BOARD_DIM)].push(space)
    })
    return nnState
  }

  getLegalMove(nnInput, board) {
    return tf.tidy(() => {
      const logits = this.NN.model.predict(tf.tensor([nnInput])).dataSync().filter((e,i) => board.isLegal(i))
      this.NN.model.predict(tf.tensor([nnInput])).dataSync()
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
      reward = reward * 0.5
    })
    rewards.reverse()
    // console.log(this.actions, rewards, this.boards)
    this.NN.train(this.actions, rewards, this.boards)
    return null
  }
}