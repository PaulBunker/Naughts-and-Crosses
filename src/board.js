const GAME_RESULT = {
  NOT_FINISHED : 0,
  NAUGHT_WIN : 1,
  CROSS_WIN : 2,
  DRAW : 3,
}

const EMPTY = 0
const NAUGHT = 1
const CROSS = 2

const BOARD_DIM = 3
const BOARD_SIZE = BOARD_DIM * BOARD_DIM

const WIN_CHECK_DIRECTIONS = {
  0: [[1, 1], [1, 0], [0, 1]],
  1: [[1, 0]],
  2: [[1, 0], [1, -1]],
  3: [[0, 1]],
  6: [[0, 1]]
}

class Board {
  constructor(state = null) {
    if( state === null){
      this.state = Array(BOARD_SIZE).fill(0)
    } else {
      self.state = Object.assign([], state) // make a copy
    }
  }

  hashValue() {
    //TODO: this
  }

  static otherSide(side) {
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
    const index = Math.floor(Math.random() * this.numEmpty())
    for (let i = 0; i < 9; i++) {
      if(self.state[i] === EMPTY){
        if (index == 0){
          return i
        } else {
          index--
        }
      }
    }
  }

  isLegal(pos) {
    return (0 <= pos < BOARD_SIZE) && (self.state[pos] == EMPTY)
  }

  move(position, side) {
    if (this.state[position] !== EMPTY)
      throw "Invalid move"

    this.state[position] = side

    if(this.checkWin()) {
      const winner = side === CROSS ? GAME_RESULT.CROSS_WIN : GAME_RESULT.NAUGHT_WIN
      return [this.state, winner, true]
    }

    if(this.numEmpty()) {
      return [this.state, GAME_RESULT.DRAW, true]
    }

    return [this.state, GAME_RESULT.NOT_FINISHED, false]
  }

  applyDirection(position, direction) {
    row = Math.floor(position / BOARD_DIM)
    col = pos % 3
    row += direction[0]
    if (row < 0 || row > 2)
        throw "out of bounds"
    col += direction[1]
    if (col < 0 || col > 2)
        throw "out of bounds"

    return row * 3 + col
  }

  checkWinInDirection(position, direction) {
    const c = this.state[position]
    if (self.state[position] === EMPTY) return false

    const p1 = this.applyDirection(position, direction)
    const p2 = this.applyDirection(p1, direction)

    if(c === this.state[p1] === this.state[p2]) return true

    return false
  }

}
