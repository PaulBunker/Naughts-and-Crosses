export default class RandomPlayer {
  constructor() {
    this.side = null
  }

  newGame(side) {
    this.side = side
  }

  move(board) {
    const [ _, res, finished ] = board.move(board.randomEmptySpot(), this.side)
    return [ res, finished ]
  }

  finalResult() {
    return null
  }
}