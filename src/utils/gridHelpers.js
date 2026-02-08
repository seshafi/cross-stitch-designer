export function createGrid(width, height) {
  return new Uint16Array(width * height);
}

export function resizeGrid(oldGrid, oldWidth, oldHeight, newWidth, newHeight) {
  const newGrid = createGrid(newWidth, newHeight);
  const copyW = Math.min(oldWidth, newWidth);
  const copyH = Math.min(oldHeight, newHeight);
  for (let y = 0; y < copyH; y++) {
    for (let x = 0; x < copyW; x++) {
      newGrid[y * newWidth + x] = oldGrid[y * oldWidth + x];
    }
  }
  return newGrid;
}

export function gridToArray(grid) {
  return Array.from(grid);
}

export function arrayToGrid(arr) {
  return new Uint16Array(arr);
}
