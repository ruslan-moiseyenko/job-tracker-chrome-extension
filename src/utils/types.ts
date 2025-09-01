export interface Position {
  x: number;
  y: number;
}

export interface EnhancedPosition extends Position {
  useRightBottom?: boolean;
  right?: number;
  bottom?: number;
}

export interface DragState {
  isDragging: boolean;
  startPosition: Position;
  offset: Position;
  hasMoved: boolean;
}

export interface ViewportDimensions {
  width: number;
  height: number;
}
