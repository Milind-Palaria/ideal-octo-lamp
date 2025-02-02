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

const App = () => {
  const [elements, setElements] = useState([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Canvas dimensions
  const width = 1400;
  const height = 700;

  // When zoom level is below or equal to this, clustering is active.
  const clusterThreshold = 0.8;

  // Intrinsic radii (in data coordinates):
  const defaultPointRadius = 20; // For individual points
  const fixedClusterRadius = 40; // Desired on-screen cluster radius (constant)

  // --- CLUSTERING LOGIC ---
  const clusterElements = useCallback(() => {
    setElements((prev) => {
      // Consider both individual points and any existing clusters.
      const items = prev.filter(
        (el) => el.type === "point" || el.type === "cluster"
      );
      const n = items.length;
      if (n === 0) return prev;

      // Compute an effective radius (in data coordinates) for each item:
      // • For a point, it is its intrinsic radius.
      // • For a cluster, we want its on-screen radius to be fixed;
      //   so we set its effective radius = fixedClusterRadius / zoomLevel.
      const effectiveRadius = (item) => {
        if (item.type === "point") {
          return item.radius || defaultPointRadius;
        } else {
          return fixedClusterRadius / zoomLevel;
        }
      };

      // Create union-find structure to group overlapping items.
      const uf = new UnionFind(n);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const r1 = effectiveRadius(items[i]);
          const r2 = effectiveRadius(items[j]);
          const dx = items[i].x - items[j].x;
          const dy = items[i].y - items[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d <= r1 + r2) {
            uf.union(i, j);
          }
        }
      }

      // Group items by their union-find root.
      const groups = {};
      for (let i = 0; i < n; i++) {
        const root = uf.find(i);
        if (!groups[root]) {
          groups[root] = [];
        }
        groups[root].push(items[i]);
      }

      const newElements = [];
      Object.values(groups).forEach((group) => {
        if (group.length === 1) {
          // Single item remains as is.
          newElements.push(group[0]);
        } else {
          // Merge items into a new cluster.
          // Flatten any existing clusters into their individual points.
          const points = group.flatMap((item) =>
            item.type === "point" ? [item] : item.points
          );
          const totalPoints = points.length;

          // Compute the new cluster's center (average of item centers)
          const centerX =
            group.reduce((sum, item) => sum + item.x, 0) / group.length;
          const centerY =
            group.reduce((sum, item) => sum + item.y, 0) / group.length;

          // Aggregate color counts.
          const colorCounts = {};
          group.forEach((item) => {
            if (item.type === "point") {
              colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
            } else {
              Object.entries(item.colorCounts).forEach(([color, count]) => {
                colorCounts[color] = (colorCounts[color] || 0) + count;
              });
            }
          });

          // Set the new cluster’s intrinsic radius so that, when rendered,
          // its on-screen radius is fixed:
          //   intrinsicClusterRadius * zoomLevel = fixedClusterRadius
          // Thus, intrinsicClusterRadius = fixedClusterRadius / zoomLevel.
          newElements.push({
            id: uuidv4(),
            type: "cluster",
            points, // all individual points in the cluster
            x: centerX,
            y: centerY,
            radius: fixedClusterRadius / zoomLevel, // intrinsic (data) radius for clusters
            colorCounts,
            total: totalPoints,
          });
        }
      });

      return newElements;
    });
  }, [defaultPointRadius, fixedClusterRadius, zoomLevel]);

  // --- EFFECT: Cluster or decluster based on zoom level ---
  useEffect(() => {
    if (zoomLevel <= clusterThreshold) {
      clusterElements();
    } else {
      // When zoomed in, flatten clusters to show individual points.
      setElements((prev) =>
        prev.flatMap((el) => (el.type === "cluster" ? el.points : el))
      );
    }
  }, [zoomLevel, clusterElements, clusterThreshold]);

  // --- ADDING POINTS ---
  const addPoint = useCallback(
    (color, x, y) => {
      const newPoint = {
        id: uuidv4(),
        type: "point",
        // Convert click coordinates (screen) to data coordinates.
        x: x / zoomLevel,
        y: y / zoomLevel,
        color,
        radius: defaultPointRadius, // intrinsic radius remains constant
      };
      setElements((prev) => [...prev, newPoint]);
    },
    [zoomLevel, defaultPointRadius]
  );

  // --- EVENT HANDLERS ---
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

  const toggleManualMode = useCallback(() => {
    setIsManualMode((prev) => !prev);
    setSelectedColor(null);
  }, []);

  // When a cluster is clicked, expand it (break it into its individual points).
  const handleClusterClick = useCallback((clusterId) => {
    setElements((prev) =>
      prev.flatMap((el) =>
        el.type === "cluster" && el.id === clusterId
          ? el.points.map((p) => ({ ...p, type: "point" }))
          : el
      )
    );
  }, []);

  // --- ZOOM HANDLERS ---
  const handleZoomIn = useCallback(
    () => setZoomLevel((prev) => Math.min(prev + 0.1, 2)),
    []
  );
  // Updated lower bound from 0.5 to 0.1
  const handleZoomOut = useCallback(
    () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.1)),
    []
  );

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
