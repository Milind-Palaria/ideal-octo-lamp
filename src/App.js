// App.jsx
import React, { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import ManualModeSelector from "./components/ManualModeSelector";

// --- Union-Find (Disjoint Set) Helper Class ---
class UnionFind {
  constructor(n) {
    this.parent = new Array(n);
    for (let i = 0; i < n; i++) {
      this.parent[i] = i;
    }
  }

  find(i) {
    if (this.parent[i] !== i) {
      this.parent[i] = this.find(this.parent[i]);
    }
    return this.parent[i];
  }

  union(i, j) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootJ] = rootI;
    }
  }
}

// --- Main App Component ---
const App = () => {
  // State management for elements, manual mode, selected color, and zoom level.
  const [elements, setElements] = useState([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Canvas dimensions and zoom threshold
  const width = 1400;
  const height = 700;
  const clusterThreshold = 0.8; // When zoom is below or equal to this, clustering is applied.

  // Default radius for points (if not provided)
  const defaultRadius = 20;

  // --- Helper Function: Euclidean Distance ---
  const distance = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // --- New Clustering Logic: Colliding Radii ---
  const clusterElements = useCallback(() => {
    setElements((prev) => {
      // Work only on points (ignore clusters)
      const points = prev.filter((el) => el.type === "point");
      const n = points.length;
      if (n === 0) return prev;

      // Create a union-find structure for n points.
      const uf = new UnionFind(n);

      // Compare every pair of points. Two points are connected if their circles (radius) touch.
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const r1 = points[i].radius || defaultRadius;
          const r2 = points[j].radius || defaultRadius;
          if (distance(points[i], points[j]) <= r1 + r2) {
            uf.union(i, j);
          }
        }
      }

      // Group points by their union-find root.
      const groups = {};
      for (let i = 0; i < n; i++) {
        const root = uf.find(i);
        if (!groups[root]) {
          groups[root] = [];
        }
        groups[root].push(points[i]);
      }

      // Create new elements: if a group has only one point, leave it; otherwise, form a cluster.
      const newElements = [];
      Object.values(groups).forEach((group) => {
        if (group.length === 1) {
          newElements.push(group[0]);
        } else {
          // Calculate the cluster's center by averaging positions.
          const clusterX =
            group.reduce((sum, p) => sum + p.x, 0) / group.length;
          const clusterY =
            group.reduce((sum, p) => sum + p.y, 0) / group.length;
          // Count colors in the cluster.
          const colorCounts = group.reduce((acc, p) => {
            acc[p.color] = (acc[p.color] || 0) + 1;
            return acc;
          }, {});
          newElements.push({
            id: uuidv4(),
            type: "cluster",
            points: group,
            x: clusterX,
            y: clusterY,
            colorCounts,
            total: group.length,
          });
        }
      });

      // Optionally, preserve any pre-existing clusters.
      const otherElements = prev.filter((el) => el.type === "cluster");
      return [...newElements, ...otherElements];
    });
  }, [defaultRadius]);

  // --- Effect: Re-cluster based on zoom level ---
  useEffect(() => {
    if (zoomLevel <= clusterThreshold) {
      clusterElements();
    } else {
      // When zoomed in, display individual points.
      setElements((prev) =>
        prev.flatMap((el) => (el.type === "cluster" ? el.points : el))
      );
    }
  }, [zoomLevel, clusterElements, clusterThreshold]);

  // --- Adding Points ---
  // When a point is added, assign it the default radius.
  const addPoint = useCallback(
    (color, x, y) => {
      const newPoint = {
        id: uuidv4(),
        type: "point",
        x: x / zoomLevel, // unscale the coordinate to the base system
        y: y / zoomLevel,
        color,
        radius: defaultRadius,
      };
      setElements((prev) => [...prev, newPoint]);
    },
    [zoomLevel, defaultRadius]
  );

  // --- Event Handlers ---
  // Handle clicks on the canvas when manual mode is active.
  const handleCanvasClick = useCallback(
    (e) => {
      if (isManualMode && selectedColor && e.target === e.currentTarget) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addPoint(selectedColor, x, y);
      }
    },
    [isManualMode, selectedColor, addPoint]
  );

  // Toggle manual mode and reset the selected color.
  const toggleManualMode = useCallback(() => {
    setIsManualMode((prev) => !prev);
    setSelectedColor(null);
  }, []);

  // When a cluster is clicked, break it apart to reveal its individual points.
  const handleClusterClick = useCallback((clusterId) => {
    setElements((prev) =>
      prev.flatMap((el) =>
        el.type === "cluster" && el.id === clusterId
          ? el.points.map((p) => ({ ...p, type: "point" }))
          : el
      )
    );
  }, []);

  // Zoom in and out
  const handleZoomIn = useCallback(
    () => setZoomLevel((prev) => Math.min(prev + 0.1, 2)),
    []
  );
  const handleZoomOut = useCallback(
    () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5)),
    []
  );

  // --- Render ---
  return (
    <div>
      <Toolbar
        addPoint={addPoint}
        clusterElements={clusterElements}
        toggleManualMode={toggleManualMode}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        width={width}
        height={height}
      />
      {isManualMode && (
        <ManualModeSelector
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
        />
      )}
      <Canvas
        width={width}
        height={height}
        elements={elements}
        zoomLevel={zoomLevel}
        handleCanvasClick={handleCanvasClick}
        handleClusterClick={handleClusterClick}
        isManualMode={isManualMode}
      />
    </div>
  );
};

export default App;
