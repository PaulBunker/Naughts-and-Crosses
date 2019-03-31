import * as tf from '@tensorflow/tfjs-node'
import { BOARD_SIZE, GAME_RESULT, EMPTY, NAUGHT, CROSS} from './constants'
import Board from './board'

var argMax = (a) => a.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0)

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

class ValuePlusAdvantage extends tf.layers.Layer {
  constructor() {
    super({})
  }
  computeOutputShape(inputShape) { 
    return [inputShape[1]] 
  }

  call(input) { return input[0].add(input[1].sub(input[1].mean())) }
 
  getClassName() { return 'ValuePlusAdvantage' }
}

class NNModel {
  constructor(learning_rate){
    this.learning_rate = learning_rate
    this.model = this.compileModel()
  }

  compileModel() {
    const input = tf.layers.dense({
      units: BOARD_SIZE * 3 * 9,
      inputShape: [BOARD_SIZE * 3],
      activation: 'relu',
    })

    const output = tf.layers.dense({
      units: BOARD_SIZE,
    })

    const model = tf.sequential({
      layers: [
        input,
        output,
      ]
    })
    const optimizer = tf.train.adam(this.learningRate)

    model.compile({
      optimizer,
      loss: 'meanSquaredError',
    })

    return model
  }

  async train(inputs, targets) {
    return await this.model.fit( tf.tensor(inputs), tf.tensor(targets)).then(history => history)
  }
}
class NNModell {
  constructor(learning_rate){
    this.learning_rate = learning_rate
    this.model = this.compileModel()
  }

  compileModel() {

    const input = tf.input({shape:[BOARD_SIZE * 3]})

    const hidden = tf.layers.dense({
      units: BOARD_SIZE * 3 * 9,
      activation: 'relu',
      kernelInitializer: 'varianceScaling',
      name: 'hidden'
    }).apply(input)

    const advantage = tf.layers.dense({
      units: BOARD_SIZE,
      name: 'advantage',
      kernelInitializer: 'varianceScaling',
    }).apply(hidden)

    const value = tf.layers.dense({
      units: 1,
      name: 'value',
      kernelInitializer: 'varianceScaling',
    }).apply(hidden)

    const output = new ValuePlusAdvantage().apply([value, advantage])

    const model = tf.model({
      inputs: input, 
      outputs: output
    })
    
    const optimizer = tf.train.adam(this.learningRate)

    model.compile({
      optimizer,
      loss: 'meanSquaredError',
    })
    return model
  }

  async train(inputs, targets) {
    return await this.model.fit( tf.tensor(inputs), tf.tensor(targets),{verbose:1}).then(history => history)
  }
}

class ReplayBuffer {
  constructor(buffer_size=3000) {
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

export default class ExpDoubleDuelQPlayer {
  constructor(
    name = null, reward_discount = 0.95, win_value = 1.0, draw_value = 0.3,
    loss_value = -1.0, learning_rate = 0.01, training = true, random_move_prob = 0.95, 
    random_move_decrease = 0.95, batch_size = 50, pre_training_games = 500, tau = 0.001
  ) {
    this.batch_size = batch_size
    this.reward_discount = reward_discount
    this.win_value = win_value
    this.draw_value = draw_value
    this.loss_value = loss_value
    this.side = null
    this.board_position_log = []
    this.action_log = []

 
    this.name = name
    this.q_net = new NNModel(learning_rate)
    this.target_net = new NNModel(learning_rate)
    // this.target_net = this.q_net


    this.training = training
    this.random_move_prob = random_move_prob
    this.random_move_decrease = random_move_decrease
    this.replay_buffer_win = new ReplayBuffer()
    this.replay_buffer_loss = new ReplayBuffer()
    this.replay_buffer_draw = new ReplayBuffer()
    this.pre_training_games = pre_training_games
    this.game_counter = 0
    this.tau = tau
    
  }
  
  copyGraph() {
    const targetWeights = this.target_net.model.weights
    this.q_net.model.weights.forEach((w, i) => {
      const newVals = w.val.mul(this.tau).add(targetWeights[i].val.mul(1-this.tau))
      w.val.assign(newVals)
    })
  }

  boardToNNInput(state){
    return [
      ...state.map((space) => space === this.side ? 1 : 0 ),
      ...state.map((space) => space === otherSide(this.side) ? 1 : 0 ),
      ...state.map((space) => space === EMPTY ? 1 : 0 ),
    ]
  }

  newGame(side) {
    this.side = side
    this.board_position_log = []
    this.action_log = []
  }

  calculateTargets() {
    const targets = []
    for (let i = 0; i < this.action_log.length; i++) {
      const target = [...this.values_log[i]]
      target[this.action_log[i]] = this.reward_discount * this.next_max_log[i]
      targets.push(target)
    }
    return targets
  }

  addGameToReplayBuffer(reward){
    let buffer
    switch (reward) {
    case this.win_value:
      buffer = this.replay_buffer_win
      break
    case this.loss_value:
      buffer = this.replay_buffer_loss
      break
    default:
      buffer = this.replay_buffer_draw
      break
    }
    // console.log(buffer)

    const game_length = this.action_log.length

    for (let i = 0; i < game_length -1; i++) {
      buffer.add([this.board_position_log[i], this.action_log[i], this.board_position_log[i + 1], 0])
      // console.log(this.action_log[i])
    }
    buffer.add([this.board_position_log[game_length - 1], this.action_log[game_length - 1], null, reward])

  }

  getQs(input_pos, network) {
    const qvalues = network.model.predict(tf.tensor(input_pos))
    const probs = tf.softmax(qvalues).dataSync()

    return [ probs, qvalues.dataSync() ]
  }

  getValidProbs(input_pos, network, board){
    let [ probs, qvalues ] = this.getQs(input_pos, network)
    console.log(qvalues, qvalues.length)
    for (let i = 0; i < qvalues.length; i++) {
      if(!board.isLegal(i)){
        probs[i] = -1
      } else if(probs[i] < 0) {
        probs[i] = 0.0
      }
    }

    return [probs, qvalues]
  }

  get_valid_probs_list(states, boards) {
    const probsList = []
    const qValsList = []
    const model = this.target_net

    states.forEach((state, i) => {
      const [probs, qs] = this.getValidProbs([state], model, boards[i])
      probsList.push(probs)
      qValsList.push(qs)
    })
    
    return [probsList, qValsList]
  }

  move(board) {
    this.board_position_log.push([...board.state])
    const nn_input = this.boardToNNInput(board.state)
    let [probs, _] = this.getValidProbs([nn_input], this.q_net, board)

    let move
    if(
      this.training === true && 
      (
        this.game_counter < this.pre_training_games || 
        Math.random() < this.random_move_prob
      )
    ) {
      move = board.randomEmptySpot()
    } else {
      move = tf.argMax(probs).dataSync()[0]
    }
    this.action_log.push(move)

    const [nah, res, finished] = board.move(move, this.side)
    return [ res, finished ]
  }

  async finalResult(result) {

    this.game_counter += 1

    let reward
    if(
      (result === GAME_RESULT.NAUGHT_WIN && this.side === NAUGHT) ||
      (result === GAME_RESULT.CROSS_WIN && this.side === CROSS)
    ){
      reward = this.win_value
    } else if (
      (result === GAME_RESULT.NAUGHT_WIN && this.side === CROSS) ||
      (result === GAME_RESULT.CROSS_WIN && this.side === NAUGHT)
    ) {

      reward = this.loss_value
    } else if (result === GAME_RESULT.DRAW) {
      reward = this.draw_value
    }

    this.addGameToReplayBuffer(reward)

    if(this.training && this.game_counter > this.pre_training_games) {
      const batch_third = Math.floor(this.batch_size/3)
      const train_batch = [
        ...this.replay_buffer_win.sample(batch_third),
        ...this.replay_buffer_loss.sample(batch_third),
        ...this.replay_buffer_draw.sample(batch_third),
      ]

      const next_states = []
      const target_qs = []
      train_batch.forEach(s => {
        if(s[2] !== null) next_states.push(s[2])
      })
      if (next_states.length > 0) {

        const [ probs, qvals ] = this.get_valid_probs_list(
          next_states.map(s => this.boardToNNInput(s)),
          next_states.map(s => new Board(s))
        )
        
        let ti = 0
        train_batch.forEach(t => {
          if(t[2] !== null) {
            const max_move = argMax(probs[ti])
            qvals[ti][max_move] = qvals[ti][max_move] * this.reward_discount
            target_qs.push(qvals[ti])
            ti += 1
          } else {
            const [probs, qvals] = this.getQs([this.boardToNNInput(t[0])], this.target_net)
            qvals[t[1]] = t[3] 
            target_qs.push(qvals)
          }
        })


        if (ti !== next_states.length){
          throw('Something wrong here!!!')
        }

      } else {
        throw('figure this out')
      }
      
      const nn_input = train_batch.map(x => this.boardToNNInput(x[0]))
      const train = await this.q_net.train(nn_input, target_qs)
      this.copyGraph()
      this.random_move_prob *= this.random_move_decrease
      return train

    }
  }
}
