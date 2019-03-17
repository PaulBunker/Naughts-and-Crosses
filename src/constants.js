export const EMPTY = 0
export const NAUGHT = 1
export const CROSS = 2

export const GAME_RESULT = {
  NOT_FINISHED : 0,
  NAUGHT_WIN : NAUGHT,
  CROSS_WIN : CROSS,
  DRAW : 3,
}

export const BOARD_DIM = 3
export const BOARD_SIZE = BOARD_DIM * BOARD_DIM

export const WIN_CHECK_DIRECTIONS = {
  0: [[1, 1], [1, 0], [0, 1]],
  1: [[1, 0]],
  2: [[1, 0], [1, -1]],
  3: [[0, 1]],
  6: [[0, 1]]
}

export const MIN_MAX = {
  WIN: 1,
  DRAW: 0,
  LOSS: -1,
}
