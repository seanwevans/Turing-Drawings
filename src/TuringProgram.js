// Utilities and class for the 2D Turing machine

const DIRECTIONS = {
  LEFT: 0,
  RIGHT: 1,
  UP: 2,
  DOWN: 3
};

const DIRECTION_NAMES = ['LEFT', 'RIGHT', 'UP', 'DOWN'];

const createRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

class TuringProgram {
  constructor(numStates, numSymbols, width, height, numHeads, headRadius, seed, transitionTable = null, initialHeads = null) {
    this.numStates = numStates;
    this.numSymbols = numSymbols;
    this.width = width;
    this.height = height;
    this.numHeads = numHeads;
    this.headRadius = headRadius;
    this.seed = seed;
    this.initialHeads = initialHeads;
    this.table = new Int32Array(numStates * numSymbols * 3);
    this.grid = new Int32Array(width * height);
    this.heads = new Array(numHeads);
    this.iterations = 0;

    const random = createRandom(seed);

    if (transitionTable) {
      for (const transition of transitionTable) {
        const state = transition.currentState;
        const symbol = transition.currentSymbol;
        const newState = transition.newState;
        const newSymbol = transition.newSymbol;
        const action = typeof transition.action === 'string'
          ? DIRECTION_NAMES.indexOf(transition.action)
          : transition.action;

        const idx = (numStates * symbol + state) * 3;
        this.table[idx] = newState;
        this.table[idx + 1] = newSymbol;
        this.table[idx + 2] = action;
      }
    } else {
      for (let state = 0; state < numStates; state++) {
        for (let symbol = 0; symbol < numSymbols; symbol++) {
          const newState = Math.floor(random() * numStates);
          const newSymbol = (symbol === 0)
            ? 1 + Math.floor(random() * (numSymbols - 1))
            : Math.floor(random() * numSymbols);
          const action = Math.floor(random() * 4);
          const idx = (numStates * symbol + state) * 3;
          this.table[idx] = newState;
          this.table[idx + 1] = newSymbol;
          this.table[idx + 2] = action;
        }
      }
    }

    this.reset();
  }

  reset() {
    this.grid.fill(0);

    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);

    const radius = Math.min(this.width, this.height) * this.headRadius;
    const random = createRandom(this.seed);

    for (let i = 0; i < this.numHeads; i++) {
      const angle = (i * 2 * Math.PI) / this.numHeads;
      const x = centerX + Math.round(radius * Math.cos(angle));
      const y = centerY + Math.round(radius * Math.sin(angle));

      const boundedX = Math.max(0, Math.min(this.width - 1, x));
      const boundedY = Math.max(0, Math.min(this.height - 1, y));

      if (!this.heads[i]) {
        this.heads[i] = { state: 0, x: boundedX, y: boundedY };
      } else {
        this.heads[i].state = 0;
        this.heads[i].x = boundedX;
        this.heads[i].y = boundedY;
      }

      this.grid[boundedY * this.width + boundedX] = 1 + (i % (this.numSymbols - 1));
    }

    const patternSize = Math.min(5, Math.floor(Math.min(this.width, this.height) / 40));
    for (let x = -patternSize; x <= patternSize; x++) {
      for (let y = -patternSize; y <= patternSize; y++) {
        if (random() < 0.8) continue;

        const gx = (centerX + x + this.width) % this.width;
        const gy = (centerY + y + this.height) % this.height;

        this.grid[gy * this.width + gx] = 1 + Math.floor(random() * (this.numSymbols - 1));
      }
    }

    this.iterations = 0;
  }

  update(steps) {
    const width = this.width;
    const numStates = this.numStates;

    for (let i = 0; i < steps; i++) {
      for (let h = 0; h < this.heads.length; h++) {
        const head = this.heads[h];
        const gridIdx = head.y * width + head.x;
        const symbol = this.grid[gridIdx];
        const state = head.state;
        const tableIdx = (numStates * symbol + state) * 3;

        head.state = this.table[tableIdx];
        const newSymbol = this.table[tableIdx + 1];
        this.grid[gridIdx] = newSymbol < this.numSymbols ? newSymbol : 0;

        switch (this.table[tableIdx + 2]) {
          case DIRECTIONS.LEFT:
            head.x = (head.x + 1) % width;
            break;
          case DIRECTIONS.RIGHT:
            head.x = (head.x - 1 + width) % width;
            break;
          case DIRECTIONS.UP:
            head.y = (head.y - 1 + this.height) % this.height;
            break;
          case DIRECTIONS.DOWN:
            head.y = (head.y + 1) % this.height;
            break;
        }
      }
      this.iterations++;
    }
  }

  exportToJson() {
    const transitionTable = [];

    for (let state = 0; state < this.numStates; state++) {
      for (let symbol = 0; symbol < this.numSymbols; symbol++) {
        const idx = (this.numStates * symbol + state) * 3;
        const newState = this.table[idx];
        const newSymbol = this.table[idx + 1];
        const action = this.table[idx + 2];

        transitionTable.push({
          currentState: state,
          currentSymbol: symbol,
          newState,
          newSymbol,
          action: DIRECTION_NAMES[action],
        });
      }
    }

    const headPositions = this.heads.map((head) => ({
      state: head.state,
      x: head.x,
      y: head.y,
    }));

    return {
      parameters: {
        numStates: this.numStates,
        numSymbols: this.numSymbols,
        numHeads: this.numHeads,
        headRadius: this.headRadius,
        width: this.width,
        height: this.height,
        seed: this.seed,
        iterations: this.iterations,
      },
      transitionTable,
      currentHeads: headPositions,
    };
  }

  getTransitionTableDisplay() {
    const table = [];

    for (let state = 0; state < this.numStates; state++) {
      for (let symbol = 0; symbol < this.numSymbols; symbol++) {
        const idx = (this.numStates * symbol + state) * 3;
        const newState = this.table[idx];
        const newSymbol = this.table[idx + 1];
        const action = this.table[idx + 2];

        table.push({
          state,
          symbol,
          newState,
          newSymbol,
          action: DIRECTION_NAMES[action],
        });
      }
    }

    return table;
  }

  getActiveStates() {
    const states = new Set();
    for (let i = 0; i < this.heads.length; i++) {
      states.add(this.heads[i].state);
    }
    return Array.from(states);
  }
}

export default TuringProgram;
