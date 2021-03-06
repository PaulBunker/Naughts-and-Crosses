import Board from './board'
import { MIN_MAX, EMPTY } from './constants'

export default class MinMaxPlayer {
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
      return this.cache[boardHash]
    }
    
    let minValue = MIN_MAX.DRAW

    let action = -1
    
    const winner = board.whoWon()
    if(winner === this.side){
      minValue = MIN_MAX.WIN
      action = -1  
    } else if (winner === board.otherSide(this.side)) {
      minValue = MIN_MAX.LOSS
      action = -1  
    } else {      
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
  
          if (minValue === MIN_MAX.LOSS){
            this.cache[boardHash] = [minValue, action]
            return [minValue, action]
          }
        }
        this.cache[boardHash] = [minValue, action]
      }
    }
    return [ minValue, action ]
  }

  max(board) {
    const boardHash = board.hashValue()
    if (this.cache.hasOwnProperty(boardHash)) {
      return this.cache[boardHash]
    }

    let maxValue = MIN_MAX.DRAW
    let action = -1

    const winner = board.whoWon()
    if (winner === this.side) {
      maxValue = MIN_MAX.WIN
      action = -1  
    } else if (winner === board.otherSide(this.side)){
      maxValue = MIN_MAX.LOSS
      action = -1 
    } else {
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

          if (maxValue === MIN_MAX.WIN){
            this.cache[boardHash] = [maxValue, action]
            return [ maxValue, action ]
          }
        }
        this.cache[boardHash] = [ maxValue, action ]
      }
    }
    return [ maxValue, action ]

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