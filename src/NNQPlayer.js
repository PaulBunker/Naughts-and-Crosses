import * as tf from '@tensorflow/tfjs-node'
import { GAME_RESULT, EMPTY, NAUGHT, CROSS} from './constants'

class NNModel {
  
}

export default class NNQPlayer {
  constructor(
    name, reward_discount = 0.95, win_value = 1.0, draw_value = 0.0,
    loss_value = -1.0, learning_rate = 0.01, training = true
  ) {
    this.reward_discount = reward_discount
    this.win_value = win_value
    this.draw_value = draw_value
    this.loss_value = loss_value
    this.side = null
    this.board_position_log = []
    this.action_log = []
    this.next_max_log = []
    this.values_log = []
    this.name = name
    this.nn = this.getModel(name, learning_rate)
    this.training = training
  }

  boardToNNInput(state){
    return [
      ...state.map((space) => space === this.side ? 1 : 0 ),
      ...state.map((space) => space === this.board.otherSide(this.side) ? 1 : 0 ),
      ...state.map((space) => space === EMPTY ? 1 : 0 ),
    ]
  }

  newGame(side) {
    this.side = side
    this.board_position_log = []
    this.action_log = []
    this.next_max_log = []
    this.values_log = []
  }

  calculateTargets() {
    const targets = []
    for (let i = 0; i < this.action_log.length; i++) {
      const target = [...this.values_log[i]]
      target[self.action_log[i]] = self.reward_discount * self.next_max_log[i]
      targets.push(target)  
    }
    return targets
  }

  getQs(input_pos) {
    return this.model.predict(tf.tensor([input_pos]))
  }

  move(board) {
    self.board_position_log.push([...board.state])
    const nn_input = this.boardToNNInput(board.state)
    let qvalues = self.getQs(nn_input)
    const probs = tf.softmax(qvalues)[0]
    qvalues = qvalues.dataSync()[0]

    for (let i = 0; i < qvalues.length; i++) {
      if(!board.isLegal(i)){
        probs[i] = -1
      }        
    }

    const move = tf.argmax(probs) 

    if (this.action_log.length > 0) this.next_max_log.push(qvalues[move])
    this.action_log.push(move)
    this.values_log.push(qvalues)

    const [_, res, finished] = board.move(move, self.side)
    return [ res, finished ]
  }

  finalResult(result) {
    let finalValue
    if(
      (result === GAME_RESULT.NAUGHT_WIN && this.side === NAUGHT) ||
      (result === GAME_RESULT.CROSS_WIN && this.side === CROSS)
    ){
      finalValue = this.win_value
    } else if (
      (result === GAME_RESULT.NAUGHT_WIN && this.side === CROSS) ||
      (result === GAME_RESULT.CROSS_WIN && this.side === NAUGHT)
    ) {

      finalValue = this.loss_value
    } else if (result === GAME_RESULT.DRAW) {
      finalValue = this.draw_value
    }

    this.next_max_log.push(finalValue)

    if(this.training) {
      const targets = this.calculateTargets()
      const inputs = this.board_position_log.map(x => this.boardToNNInput(x))
      this.nn.train(inputs, targets)
    }

  }
}

