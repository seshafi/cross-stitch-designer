import { createContext, useContext, useReducer, useCallback } from 'react';
import { createGrid } from '../utils/gridHelpers.js';

const PatternContext = createContext(null);
const PatternDispatchContext = createContext(null);

const DEFAULT_WIDTH = 50;
const DEFAULT_HEIGHT = 50;

function createInitialState() {
  return {
    id: null,
    name: 'Untitled Pattern',
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    notes: '',
    palette: [],
    grid: createGrid(DEFAULT_WIDTH, DEFAULT_HEIGHT),
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    activePaletteIndex: 0,
    tool: 'paint',
    showGrid: true,
    dirty: false,
  };
}

function patternReducer(state, action) {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, tool: action.tool };

    case 'SET_ACTIVE_COLOR':
      return { ...state, activePaletteIndex: action.index };

    case 'ADD_PALETTE_COLOR': {
      const exists = state.palette.some(c => c.dmc === action.color.dmc);
      if (exists) return state;
      return {
        ...state,
        palette: [...state.palette, action.color],
        activePaletteIndex: state.palette.length,
        dirty: true,
      };
    }

    case 'REMOVE_PALETTE_COLOR': {
      const removeIdx = action.index;
      if (removeIdx < 0 || removeIdx >= state.palette.length) return state;
      const paletteIndex = removeIdx + 1;
      const newGrid = new Uint16Array(state.grid.length);
      for (let i = 0; i < state.grid.length; i++) {
        const v = state.grid[i];
        if (v === paletteIndex) {
          newGrid[i] = 0;
        } else if (v > paletteIndex) {
          newGrid[i] = v - 1;
        } else {
          newGrid[i] = v;
        }
      }
      const newPalette = state.palette.filter((_, i) => i !== removeIdx);
      let newActive = state.activePaletteIndex;
      if (newActive >= newPalette.length) newActive = Math.max(0, newPalette.length - 1);
      return { ...state, palette: newPalette, grid: newGrid, activePaletteIndex: newActive, dirty: true };
    }

    case 'SET_CELL': {
      const { x, y, colorIndex } = action;
      const idx = y * state.width + x;
      if (state.grid[idx] === colorIndex) return state;
      const newGrid = new Uint16Array(state.grid);
      newGrid[idx] = colorIndex;
      return { ...state, grid: newGrid, dirty: true };
    }

    case 'SET_CELLS': {
      const newGrid = new Uint16Array(action.grid);
      return { ...state, grid: newGrid, dirty: true };
    }

    case 'UPDATE_GRID': {
      return { ...state, grid: action.grid, dirty: true };
    }

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'SET_PATTERN': {
      const { id, name, width, height, notes, palette, grid, createdAt, modifiedAt } = action.pattern;
      return {
        ...state,
        id,
        name,
        width,
        height,
        notes: notes || '',
        palette,
        grid: new Uint16Array(grid),
        createdAt,
        modifiedAt,
        activePaletteIndex: 0,
        dirty: false,
      };
    }

    case 'NEW_PATTERN': {
      const w = action.width || DEFAULT_WIDTH;
      const h = action.height || DEFAULT_HEIGHT;
      return {
        ...createInitialState(),
        width: w,
        height: h,
        grid: createGrid(w, h),
        id: null,
      };
    }

    case 'RESIZE_GRID': {
      const { width: newW, height: newH, grid: resizedGrid } = action;
      return { ...state, width: newW, height: newH, grid: resizedGrid, dirty: true };
    }

    case 'SET_NAME':
      return { ...state, name: action.name, dirty: true };

    case 'SET_NOTES':
      return { ...state, notes: action.notes, dirty: true };

    case 'MARK_SAVED':
      return { ...state, id: action.id, dirty: false, modifiedAt: Date.now() };

    default:
      return state;
  }
}

export function PatternProvider({ children }) {
  const [state, dispatch] = useReducer(patternReducer, null, createInitialState);

  return (
    <PatternContext.Provider value={state}>
      <PatternDispatchContext.Provider value={dispatch}>
        {children}
      </PatternDispatchContext.Provider>
    </PatternContext.Provider>
  );
}

export function usePattern() {
  const ctx = useContext(PatternContext);
  if (!ctx) throw new Error('usePattern must be used within PatternProvider');
  return ctx;
}

export function usePatternDispatch() {
  const ctx = useContext(PatternDispatchContext);
  if (!ctx) throw new Error('usePatternDispatch must be used within PatternProvider');
  return ctx;
}
