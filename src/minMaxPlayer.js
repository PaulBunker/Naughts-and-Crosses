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
    
    let min_value = MIN_MAX.DRAW

    let action = -1
    
    const winner = board.whoWon()
    if(winner === this.side){
      min_value = MIN_MAX.WIN
      action = -1  
    } else if (winner === board.otherSide(this.side)) {
      min_value = MIN_MAX.LOSS
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
        if (res < min_value || action === -1) {
          min_value = res
          action = move
  
          if (min_value === MIN_MAX.LOSS){
            this.cache[boardHash] = [min_value, action]
            return [min_value, action]
          }
        }
        this.cache[boardHash] = [min_value, action]
      }
    }
    return [ min_value, action ]
  }

  max(board) {
    const boardHash = board.hashValue()
    if (this.cache.hasOwnProperty(boardHash)) {
      return this.cache[boardHash]
    }

    let max_value = MIN_MAX.DRAW
    let action = -1

    const winner = board.whoWon()
    if (winner === this.side) {
      max_value = MIN_MAX.WIN
      action = -1  
    } else if (winner === board.otherSide(this.side)){
      max_value = MIN_MAX.LOSS
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
        if (res > max_value || action === -1) {

          max_value = res
          action = move

          if (max_value === MIN_MAX.WIN){
            this.cache[boardHash] = [max_value, action]
            return [ max_value, action ]
          }
        }
        this.cache[boardHash] = [ max_value, action ]
      }
    }
    return [ max_value, action ]

  }

  move(board) {
    const [ score, action ] = this.max(board)
    const [ _, res, finished ] = board.move(action, this.side)
    return [ res, finished ]
  }

}