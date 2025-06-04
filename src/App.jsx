import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const DIRECTIONS = {
  LEFT: 0,
  RIGHT: 1,
  UP: 2,
  DOWN: 3
};

const DIRECTION_NAMES = ['LEFT', 'RIGHT', 'UP', 'DOWN'];

const generateColorPalette = (numSymbols) => {
  const colors = [];
    
  colors.push([0, 0, 0]);
    
  for (let i = 1; i < numSymbols; i++) {    
    const hue = (i * 0.618033988749895) % 1;
    const saturation = 0.9;
    const lightness = 0.667;
    
    colors.push(hslToRgb(hue, saturation, lightness));
  }
  
  return colors;
};

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
              
      // Ensure symbol is within bounds of numSymbols
      this.grid[boundedY * this.width + boundedX] = 1 + (i % (this.numSymbols - 1));
    }
          
    const patternSize = Math.min(5, Math.floor(Math.min(this.width, this.height) / 40));
    for (let x = -patternSize; x <= patternSize; x++) {
      for (let y = -patternSize; y <= patternSize; y++) {      
        if (random() < 0.8) continue;
        
        const gx = (centerX + x + this.width) % this.width;
        const gy = (centerY + y + this.height) % this.height;
                  
        // Ensure symbol is within bounds of numSymbols
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
        // Ensure new symbol is within bounds
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
          newState: newState,
          newSymbol: newSymbol,
          action: DIRECTION_NAMES[action]
        });
      }
    }
    
    const headPositions = this.heads.map(head => ({
      state: head.state,
      x: head.x,
      y: head.y
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
        iterations: this.iterations
      },
      transitionTable: transitionTable,
      currentHeads: headPositions
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
          action: DIRECTION_NAMES[action]
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

function renderToCanvas(canvas, prog, colors) {
  if (!canvas || !prog) return;
  
  const ctx = canvas.getContext('2d', { alpha: false });
  const imageData = ctx.createImageData(prog.width, prog.height);
  const data = imageData.data;
  
  const width = prog.width;
  const grid = prog.grid;
  const heads = prog.heads;
  
  for (let y = 0; y < prog.height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const symbol = grid[rowOffset + x];
      
      // Add safety check to prevent accessing colors that don't exist
      let r = 0, g = 0, b = 0;
      if (symbol >= 0 && symbol < colors.length) {
        [r, g, b] = colors[symbol];
      }
      
      const pixelIndex = (rowOffset + x) * 4;
      data[pixelIndex] = r;
      data[pixelIndex + 1] = g;
      data[pixelIndex + 2] = b;
      data[pixelIndex + 3] = 255;
    }
  }
  
  // Mark heads as white
  for (let i = 0; i < heads.length; i++) {
    const head = heads[i];
    const pixelIndex = (head.y * width + head.x) * 4;
    data[pixelIndex] = 255;
    data[pixelIndex + 1] = 255;
    data[pixelIndex + 2] = 255;
    data[pixelIndex + 3] = 255;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

const ColorPalette = memo(({ palette }) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-2">Color Palette</h2>
      <div className="flex justify-center gap-2 flex-wrap max-w-xl">
        {palette.map((color, i) => (
          <div key={i} className="text-center">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
            ></div>
            <p className="text-xs">{i}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

const TransitionTable = memo(({ transitionData }) => {
  return (
    <div className="mb-4 w-full max-w-4xl overflow-x-auto">
      <h2 className="text-xl font-bold mb-2">Transition Table</h2>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4 border border-gray-300">Current State</th>
            <th className="py-2 px-4 border border-gray-300">Current Symbol</th>
            <th className="py-2 px-4 border border-gray-300">New State</th>
            <th className="py-2 px-4 border border-gray-300">New Symbol</th>
            <th className="py-2 px-4 border border-gray-300">Action</th>
          </tr>
        </thead>
        <tbody>
          {transitionData.map((transition, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="py-2 px-4 border border-gray-300 text-center">{transition.state}</td>
              <td className="py-2 px-4 border border-gray-300 text-center">{transition.symbol}</td>
              <td className="py-2 px-4 border border-gray-300 text-center">{transition.newState}</td>
              <td className="py-2 px-4 border border-gray-300 text-center">{transition.newSymbol}</td>
              <td className="py-2 px-4 border border-gray-300 text-center">{transition.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const Controls = memo(({
  numStates, setNumStates,
  numSymbols, setNumSymbols,
  numHeads, setNumHeads,
  headRadius, setHeadRadius,
  speed, setSpeed,
  seed, setSeed,
  canvasWidth, setCanvasWidth,
  canvasHeight, setCanvasHeight,
  generateNewSeed,
  isRunning, toggleRunning,
  step, reset,
  exportToJson, showTransitionTable,
  setShowTransitionTable, fileInputRef
}) => {
  return (
    <>
      <div className="mb-4 flex gap-4 flex-wrap justify-center">
        <div className="flex flex-col">
          <label className="mb-1">Number of States:</label>
          <input
            type="number"
            min="2"
            max="128"
            value={numStates}
            onChange={(e) => setNumStates(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="mb-1">Number of Symbols:</label>
          <input
            type="number"
            min="2"
            max="128"
            value={numSymbols}
            onChange={(e) => setNumSymbols(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="mb-1">Number of Heads:</label>
          <input
            type="number"
            min="1"
            max="1024"
            value={numHeads}
            onChange={(e) => setNumHeads(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="mb-1">Head Radius:</label>
          <input
            type="number"
            min="0.01"
            max="1"
            step="0.01"
            value={headRadius}
            onChange={(e) => setHeadRadius(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="mb-1">Speed (ms per step):</label>
          <input
            type="number"
            min="0"
            max="1000"
            step="10"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="mb-1">Seed:</label>
          <div className="flex">
            <input
              type="number"
              min="0"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="p-2 border rounded"
            />
            <button
              onClick={generateNewSeed}
              className="ml-2 px-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              title="Generate new random seed"
            >
              🎲
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="mb-1">Canvas Width:</label>
          <input
            type="number"
            min="1"
            value={canvasWidth}
            onChange={(e) => setCanvasWidth(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1">Canvas Height:</label>
          <input
            type="number"
            min="1"
            value={canvasHeight}
            onChange={(e) => setCanvasHeight(Number(e.target.value))}
            className="p-2 border rounded"
          />
        </div>
      </div>
      
      <div className="flex gap-4 mb-4 flex-wrap justify-center">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reset
        </button>
        
        <button
          onClick={toggleRunning}
          className={`px-4 py-2 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded`}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
        
        <button
          onClick={step}
          disabled={isRunning}
          className={`px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Step
        </button>
        
        <button
          onClick={exportToJson}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Export JSON
        </button>
        
        <button
          onClick={() => fileInputRef.current.click()}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Load JSON
        </button>
        
        <button
          onClick={() => setShowTransitionTable(!showTransitionTable)}
          className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
        >
          {showTransitionTable ? 'Hide Transition Table' : 'Show Transition Table'}
        </button>
      </div>
    </>
  );
});

const TuringMachine2D = () => {
  const [canvasWidth, setCanvasWidth] = useState(512);
  const [canvasHeight, setCanvasHeight] = useState(512);

  const [numStates, setNumStates] = useState(6);
  const [numSymbols, setNumSymbols] = useState(6);
  const [numHeads, setNumHeads] = useState(36);
  const [headRadius, setHeadRadius] = useState(0.25);
  const [speed, setSpeed] = useState(0);
  const [seed, setSeed] = useState(0);
  
  const [colorPalette, setColorPalette] = useState(() => generateColorPalette(6));
  const [isRunning, setIsRunning] = useState(false);
  const [showTransitionTable, setShowTransitionTable] = useState(false);
  const [iterations, setIterations] = useState(0);
  const [activeStates, setActiveStates] = useState('0');
  const [transitionTableData, setTransitionTableData] = useState([]);
  
  const canvasRef = useRef(null);  
  const programRef = useRef(null);
  const animationRef = useRef(null);
  const fileInputRef = useRef(null);
    
  useMemo(() => {
    setColorPalette(generateColorPalette(numSymbols));
  }, [numSymbols]);
    
  const initialize = useCallback((customTransitionTable = null) => {  
    if (animationRef.current) {
      if (speed === 0) {
        cancelAnimationFrame(animationRef.current);
      } else {
        clearTimeout(animationRef.current);
      }
      animationRef.current = null;
    }
        
    const newProgram = new TuringProgram(
      numStates,
      numSymbols,
      canvasWidth,
      canvasHeight,
      numHeads,
      headRadius,
      seed,
      customTransitionTable
    );
        
    programRef.current = newProgram;    
    setIterations(0);
    setActiveStates(newProgram.getActiveStates().join(', '));
    
    if (showTransitionTable) {
      setTransitionTableData(newProgram.getTransitionTableDisplay());
    }
        
    renderToCanvas(canvasRef.current, newProgram, colorPalette);
    
    return newProgram;
  }, [numStates, numSymbols, numHeads, headRadius, seed, showTransitionTable, canvasWidth, canvasHeight, colorPalette]);
    
  const reset = useCallback(() => {
    setIsRunning(false);
    initialize();
  }, [initialize]);
    
  const step = useCallback(() => {
    if (!programRef.current || isRunning) return;
    
    programRef.current.update(1);
    setIterations(programRef.current.iterations);
    setActiveStates(programRef.current.getActiveStates().join(', '));
    renderToCanvas(canvasRef.current, programRef.current, colorPalette);
  }, [isRunning, colorPalette]);
    
  const animate = useCallback(() => {
    if (!programRef.current) return;
    
    const updateStart = performance.now();
      
    const steps = 100;
    programRef.current.update(steps);
        
    setIterations(programRef.current.iterations);
    setActiveStates(programRef.current.getActiveStates().join(', '));
    renderToCanvas(canvasRef.current, programRef.current, colorPalette);
        
    if (isRunning) {
      const updateTime = performance.now() - updateStart;
      
      if (speed === 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        const adjustedTimeout = Math.max(0, speed - updateTime);
        animationRef.current = setTimeout(animate, adjustedTimeout);
      }
    }
  }, [isRunning, speed, colorPalette]);
    
  const toggleRunning = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);
    
  const exportToJson = useCallback(() => {
    if (!programRef.current) return;
    
    const exportData = programRef.current.exportToJson();
    const jsonString = JSON.stringify(exportData, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turing-machine-2d-seed-${seed}-${numStates}S-${numSymbols}C-${numHeads}H.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [seed, numStates, numSymbols, numHeads]);
    
  const generateNewSeed = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 2**32);
    setSeed(newSeed);
  }, []);
    
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        
        if (!jsonData.parameters || !jsonData.transitionTable) {
          alert('Invalid Turing Machine JSON file');
          return;
        }
        
        const params = jsonData.parameters;
        setNumStates(params.numStates);
        setNumSymbols(params.numSymbols);
        setNumHeads(params.numHeads);
        setHeadRadius(params.headRadius || 0.3);
        setSeed(params.seed);
        if (params.width) setCanvasWidth(params.width);
        if (params.height) setCanvasHeight(params.height);
          
        setTimeout(() => {
          initialize(jsonData.transitionTable);
        }, 0);
      } catch (error) {
        alert('Error loading file: ' + error.message);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  }, [initialize]);
  
  // Effect to initialize the program when the component first mounts
  useEffect(() => {
    initialize();
    
    return () => {
      if (animationRef.current) {
        if (speed === 0) {
          cancelAnimationFrame(animationRef.current);
        } else {
          clearTimeout(animationRef.current);
        }
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Effect to reinitialize when parameters that require a reset change
  useEffect(() => {
    if (!isRunning) {
      initialize();
    }
  }, [headRadius, seed, numSymbols, numStates, numHeads, canvasWidth, canvasHeight]); // Include all parameters that need reinitialization
  
  // Effect to handle running state and animation
  useEffect(() => {
    if (isRunning) {
      animate();
    } else if (animationRef.current) {
      if (speed === 0) {
        cancelAnimationFrame(animationRef.current);
      } else {
        clearTimeout(animationRef.current);
      }
      animationRef.current = null;
    }
  }, [isRunning, animate]);
    
  useEffect(() => {
    if (showTransitionTable && programRef.current) {
      setTransitionTableData(programRef.current.getTransitionTableDisplay());
    }
  }, [showTransitionTable]);
  
  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">2D Turing Machine Visualization</h1>
      
      <Controls
        numStates={numStates}
        setNumStates={setNumStates}
        numSymbols={numSymbols}
        setNumSymbols={setNumSymbols}
        numHeads={numHeads}
        setNumHeads={setNumHeads}
        headRadius={headRadius}
        setHeadRadius={setHeadRadius}
        speed={speed}
        setSpeed={setSpeed}
        seed={seed}
        setSeed={setSeed}
        canvasWidth={canvasWidth}
        setCanvasWidth={setCanvasWidth}
        canvasHeight={canvasHeight}
        setCanvasHeight={setCanvasHeight}
        generateNewSeed={generateNewSeed}
        isRunning={isRunning}
        toggleRunning={toggleRunning}
        step={step}
        reset={reset}
        exportToJson={exportToJson}
        showTransitionTable={showTransitionTable}
        setShowTransitionTable={setShowTransitionTable}
        fileInputRef={fileInputRef}
      />
      
      <ColorPalette palette={colorPalette} />
      
      <div className="text-center mb-4">
        <p>Iterations: {iterations}</p>        
        <p>Active States: {activeStates}</p>        
      </div>
      
      <div className="border border-gray-300 mb-4 shadow-lg rounded overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="bg-black"
        />
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />
            
      {showTransitionTable && (
        <TransitionTable transitionData={transitionTableData} />
      )}
    </div>
  );
};

export default TuringMachine2D;