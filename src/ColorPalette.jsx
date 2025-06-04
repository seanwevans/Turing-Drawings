import React, { memo } from 'react';

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

export default ColorPalette;
