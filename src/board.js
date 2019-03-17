import {
  GAME_RESULT,
  EMPTY,
  NAUGHT,
  CROSS,
  BOARD_DIM,
  BOARD_SIZE,
  WIN_CHECK_DIRECTIONS
} from './constants'

export default class Board {
  constructor(state = null) {
    if( state === null) {
      this.state = Array(BOARD_SIZE).fill(0)
    } else {
      this.state = Object.assign([], state) // make a copy
    }
  }

  reset() {
    this.state = Array(BOARD_SIZE).fill(0)
  }

  hashValue() {
    let res = 0
    for (let i = 0; i < BOARD_SIZE; i++) {
      res = res*3
      res = res + this.state[i]
    }
    
    return res
  }

  otherSide(side) {
    switch(side) {
    case NAUGHT:
      return CROSS
    case CROSS:
      return NAUGHT
    default:
      throw `${side} is not a valid side`
    }
  }

  coordinateToPosition(coordinate) {
    return coordinate[0] * BOARD_DIM + coordinate[1]
  }

  positionToCoordinate(position) {
    return [Math.floor(position / BOARD_DIM), position % BOARD_DIM]
  }

  numEmpty() {
    let numZeros = 0
    for (let i = 0; i < this.state.length; i++) {
      if (this.state[i] === 0) numZeros++
    }
    return numZeros
  }

  randomEmptySpot() {
    let index = Math.floor(Math.random() * this.numEmpty())
    for (let i = 0; i < 9; i++) {
      if(this.state[i] === EMPTY){
        if (index === 0){
          return i
        } else {
          index--
        }
      }
    }
  }

  isLegal(pos) {
    return (0 <= pos < BOARD_SIZE) && (this.state[pos] == EMPTY)
  }

  move(position, side) {
    if (this.state[position] !== EMPTY)
      throw 'Invalid move'
    
    this.state[position] = side
    if(this.checkWin()) {
      const winner = side === CROSS ? GAME_RESULT.CROSS_WIN : GAME_RESULT.NAUGHT_WIN
      return [this.state, winner, true]
    }

    if(this.numEmpty() === 0) {
      return [this.state, GAME_RESULT.DRAW, true]
    }
    return [this.state, GAME_RESULT.NOT_FINISHED, false]
    
  }

  applyDirection(position, direction) {
    let row = Math.floor(position / BOARD_DIM)
    let col = position % 3
    row += direction[0]
    if (row < 0 || row > 2)
      throw 'out of bounds'
    col += direction[1]
    if (col < 0 || col > 2)
      throw 'out of bounds'

    return row * 3 + col
  }

  checkWinInDirection(position, direction) {
    const c = this.state[position]
    if (this.state[position] === EMPTY) return false
    
    const p1 = this.applyDirection(position, direction)
    const p2 = this.applyDirection(p1, direction)

    if(c === this.state[p1] && c === this.state[p2]) return true

    return false
  }

  whoWon() {
    for(var startPosition in WIN_CHECK_DIRECTIONS) {
      if (this.state[startPosition] !== EMPTY) {
        for (let i = 0; i < WIN_CHECK_DIRECTIONS[startPosition].length; i++) {
          const direction = WIN_CHECK_DIRECTIONS[startPosition][i]
          
          if(this.checkWinInDirection(startPosition, direction)){
            return this.state[startPosition]
          } 
        }
      }
    }
    return EMPTY
  }

  checkWin() {
    for(var startPosition in WIN_CHECK_DIRECTIONS) {
      if (this.state[startPosition] !== EMPTY) {
        for (let i = 0; i < WIN_CHECK_DIRECTIONS[startPosition].length; i++) {
          const direction = WIN_CHECK_DIRECTIONS[startPosition][i]
          
          if(this.checkWinInDirection(startPosition, direction)){
            return true
          } 
        }
      }
    }
    return false
  }

  stateToChar(position, html=false) {
    switch (this.state[position]) {
    case EMPTY:
      return html ? '&ensp' : ' ' 
    case NAUGHT:
      return 'o'
    default:
      return 'x'
    }
  }

  htmlString() {
    const data = this.stateToCharList(true)
    const html = ''`
      <table border="1">
        ${data.map((row) => {
    `<tr>${row.map((column)=>`<td>${column}</td>`)}</tr>`
  })}
      </table>
    ```
    return html
  }

  stateToCharList(html=false) {
    const res = []
    for (let i = 0; i < 3; i++) {
      res.push([
        this.stateToChar(i*3, html),
        this.stateToChar(i*3 + 1, html),
        this.stateToChar(i*3 + 2, html),
      ])
    }
    return res
  }

  printBoard() {
    const charList = this.stateToCharList(false)
    for (let i = 0; i < charList.length; i++) {
      const row = charList[i]
      console.log(`${row[0]}|${row[1]}|${row[2]}`)
      i !== 2 && console.log('-----')
    }
    console.log('')
  }
}
