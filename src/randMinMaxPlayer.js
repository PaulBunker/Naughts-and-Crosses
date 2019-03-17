import Board from './board'
import { MIN_MAX, EMPTY } from './constants'

const randomChoice = arr => {
  const len = arr == null ? 0 : arr.length
  return len ? arr[Math.floor(Math.random() * len)] : undefined
}

export default class RandMinMaxPlayer {
  constructor(){
    this.side = null
    this.cache = {}
  }

  newGame(side) {
    if(this.side !== side) {
      this.side = side
      this.cache = {}
    }
  }

  min(board) {
    const boardHash = board.hashValue()
    if (this.cache.hasOwnProperty(boardHash)) {
      return randomChoice(this.cache[boardHash])
    }
    let bestMoves
    const winner = board.whoWon()
    if(winner === this.side){
      bestMoves = [[MIN_MAX.WIN, -1]]
    } else if (winner === board.otherSide(this.side)) {
      bestMoves = [[MIN_MAX.LOSS, -1]]
    } else {  
      let minValue = MIN_MAX.DRAW
      let action = -1    
      bestMoves = [[minValue, -1]]
      const legalMoves = []
      board.state.forEach(( cell, index ) => {
        if (cell === EMPTY) {
          legalMoves.push(index)
        }
      })
      for (let i = 0; i < legalMoves.length; i++) {
        const move = legalMoves[i]
        const b = new Board(board.state)
        b.move(move, board.otherSide(this.side))

        const [ res, _ ] = this.max(b)
        if (res < minValue || action === -1) {
          minValue = res
          action = move
          bestMoves = [[minValue, action]]
        } else if (res === minValue) {
          action = move
          bestMoves.push([minValue, action])
        }
      }
    }
    this.cache[boardHash] = bestMoves
    return randomChoice(bestMoves)
  }

  max(board) {
    const boardHash = board.hashValue()
    if (this.cache.hasOwnProperty(boardHash)) {
      return randomChoice(this.cache[boardHash])
    }
    let bestMoves
    const winner = board.whoWon()
    if(winner === this.side){
      bestMoves = [[MIN_MAX.WIN, -1]]
    } else if (winner === board.otherSide(this.side)) {
      bestMoves = [[MIN_MAX.LOSS, -1]]
    } else {  
      let maxValue = MIN_MAX.DRAW
      let action = -1    
      bestMoves = [[maxValue, -1]]
      const legalMoves = []
      board.state.forEach(( cell, index ) => {
        if (cell === EMPTY) {
          legalMoves.push(index)
        }
      })
      for (let i = 0; i < legalMoves.length; i++) {
        const move = legalMoves[i]
        const b = new Board(board.state)
        b.move(move, this.side)

        const [ res, _ ] = this.min(b)
        if (res > maxValue || action === -1) {
          maxValue = res
          action = move
          bestMoves = [[maxValue, action]]
        } else if (res === maxValue) {
          action = move
          bestMoves.push([maxValue, action])
        }
      }
    }
    this.cache[boardHash] = bestMoves
    return randomChoice(bestMoves)
  }

  move(board) {
    const [ score, action ] = this.max(board)
    const [ _, res, finished ] = board.move(action, this.side)
    return [ res, finished ]
  }

  finalResult() {
    return null
  }
}