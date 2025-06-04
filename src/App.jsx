import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import TuringProgram from './TuringProgram.js';
import ColorPalette from './ColorPalette.jsx';
import TransitionTable from './TransitionTable.jsx';
import Controls from './Controls.jsx';

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


const TuringMachine2D = () => {
  const canvasWidth = 512;
  const canvasHeight = 512;
  
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
  }, [numStates, numSymbols, numHeads, headRadius, seed, showTransitionTable, colorPalette]);
    
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
  }, [headRadius, seed, numSymbols, numStates, numHeads]); // Include all parameters that need reinitialization
  
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
