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

export function insertRow(grid, width, height, rowIndex) {
  const newGrid = new Uint16Array(width * (height + 1));
  for (let y = 0; y < rowIndex; y++)
    for (let x = 0; x < width; x++)
      newGrid[y * width + x] = grid[y * width + x];
  for (let y = rowIndex; y < height; y++)
    for (let x = 0; x < width; x++)
      newGrid[(y + 1) * width + x] = grid[y * width + x];
  return newGrid;
}

export function deleteRow(grid, width, height, rowIndex) {
  const newGrid = new Uint16Array(width * (height - 1));
  for (let y = 0; y < rowIndex; y++)
    for (let x = 0; x < width; x++)
      newGrid[y * width + x] = grid[y * width + x];
  for (let y = rowIndex + 1; y < height; y++)
    for (let x = 0; x < width; x++)
      newGrid[(y - 1) * width + x] = grid[y * width + x];
  return newGrid;
}

export function insertColumn(grid, width, height, colIndex) {
  const newWidth = width + 1;
  const newGrid = new Uint16Array(newWidth * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < colIndex; x++)
      newGrid[y * newWidth + x] = grid[y * width + x];
    for (let x = colIndex; x < width; x++)
      newGrid[y * newWidth + (x + 1)] = grid[y * width + x];
  }
  return newGrid;
}

export function deleteColumn(grid, width, height, colIndex) {
  const newWidth = width - 1;
  const newGrid = new Uint16Array(newWidth * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < colIndex; x++)
      newGrid[y * newWidth + x] = grid[y * width + x];
    for (let x = colIndex + 1; x < width; x++)
      newGrid[y * newWidth + (x - 1)] = grid[y * width + x];
  }
  return newGrid;
}
