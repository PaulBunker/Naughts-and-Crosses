import { BOARD_SIZE, GAME_RESULT, NAUGHT, CROSS } from './constants'

const WIN_VALUE = 1.0
const DRAW_VALUE = 0.5
const LOSS_VALUE = 0.0


var argMax = (a) => a.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0)

export default class TQPlayer {
  constructor(alpha=0.5, gamma=0.94, q_init=0.6) {
    this.side = null
    this.q = {}  
    this.moveHistory = []  
    this.learning_rate = alpha
    this.value_discount = gamma
    this.q_init_val = q_init
  }

  newGame(side) {
    this.side = side
    this.moveHistory = []
    console.log(this.moveHistory)
  }

  move(board) {
    const m = this.getMove(board)
    this.moveHistory.push([board.hashValue(), m])
    const [_, res, finished] = board.move(m, this.side)
    return [res, finished]
  }

  getMove(board) {
    const boardHash = board.hashValue()
    const qVals = this.getQ(boardHash)
    while (true) {
      const move = argMax(qVals)
      if (board.isLegal(move)) {
        return move
      } else {
        qVals[move] = -1
      }
    }
  }

  getQ(boardHash) {
    let qVals
    if(boardHash in this.q) {
      qVals = this.q[boardHash]
    } else {
      qVals = Array(BOARD_SIZE).fill(this.q_init_val)
      this.q[boardHash] = qVals
    }
    return qVals
  }

  finalResult(result) {
    let finalValue
    if(
      (result === GAME_RESULT.NAUGHT_WIN && this.side === NAUGHT) ||
      (result === GAME_RESULT.CROSS_WIN && this.side === CROSS)
    ){
      finalValue = WIN_VALUE
    } else if (
      (result === GAME_RESULT.NAUGHT_WIN && this.side === CROSS) ||
      (result === GAME_RESULT.CROSS_WIN && this.side === NAUGHT)
    ) {

      finalValue = LOSS_VALUE
    } else if (result === GAME_RESULT.DRAW) {
      finalValue = DRAW_VALUE
    }

    this.moveHistory.reverse()
    let nextMax = -1.0

    for (let i = 0; i < this.moveHistory.length; i++) {
      const move = this.moveHistory[i]
      const qVals = this.getQ(move[0])
      if (nextMax < 0){
        qVals[move[1]] = finalValue
      } else {
        qVals[move[1]] = qVals[move[1]] * ( 1.0 - this.learning_rate) + this.learning_rate * this.value_discount * nextMax
      }
      nextMax = Math.max(...qVals)
    }
  }
}