export function floodFill(grid, width, height, startX, startY, newColor) {
  const idx = startY * width + startX;
  const targetColor = grid[idx];
  if (targetColor === newColor) return false;

  const stack = [[startX, startY]];
  const visited = new Uint8Array(width * height);
  let changed = false;

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const i = y * width + x;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[i]) continue;
    if (grid[i] !== targetColor) continue;

    visited[i] = 1;
    grid[i] = newColor;
    changed = true;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return changed;
}
