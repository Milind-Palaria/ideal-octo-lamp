// App.jsx
import React, { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Canvas from "./components/Canvas";
import Toolbar from "./components/Toolbar";
import ManualModeSelector from "./components/ManualModeSelector";

const App = () => {
  // === STATE MANAGEMENT ===
  const [elements, setElements] = useState([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Constants
  const width = 1400;
  const height = 700;
  const distanceThreshold = 100;
  const clusterThreshold = 0.8;

  // === CLUSTERING LOGIC ===
  const clusterElements = useCallback(() => {
    setElements((prev) => {
      const points = prev.filter((el) => el.type === "point");
      const clusters = [];
      const visited = new Set();

      points.forEach((point, i) => {
        if (!visited.has(point.id)) {
          visited.add(point.id);
          const cluster = [point];

          points.forEach((otherPoint, j) => {
            if (i !== j && !visited.has(otherPoint.id)) {
              const dx = point.x - otherPoint.x;
              const dy = point.y - otherPoint.y;
              if (Math.sqrt(dx * dx + dy * dy) <= distanceThreshold) {
                cluster.push(otherPoint);
                visited.add(otherPoint.id);
              }
            }
          });

          // Create a cluster if more than one point is close
          if (cluster.length > 1) {
            const colorCounts = cluster.reduce((acc, p) => {
              acc[p.color] = (acc[p.color] || 0) + 1;
              return acc;
            }, {});
            clusters.push({
              id: uuidv4(),
              type: "cluster",
              points: cluster,
              x: cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length,
              y: cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length,
              colorCounts,
              total: cluster.length,
            });
          } else {
            clusters.push(point);
          }
        }
      });

      // Return new elements array with clusters replacing groups of points.
      // Also include any pre-existing clusters (if needed)
      return [...clusters, ...prev.filter((el) => el.type === "cluster")];
    });
  }, [distanceThreshold]);

  // === EFFECT: AUTOMATIC CLUSTERING/DECLUSTERING BASED ON ZOOM ===
  useEffect(() => {
    if (zoomLevel <= clusterThreshold) {
      clusterElements();
    } else {
      // Replace clusters with individual points
      setElements((prev) =>
        prev.flatMap((el) => (el.type === "cluster" ? el.points : el))
      );
    }
  }, [zoomLevel, clusterElements, clusterThreshold]);

  // === ADDING POINTS ===
  const addPoint = useCallback(
    (color, x, y) => {
      const newPoint = {
        id: uuidv4(),
        type: "point",
        x: x / zoomLevel, // un-scale to match the base coordinate system
        y: y / zoomLevel,
        color,
      };
      setElements((prev) => [...prev, newPoint]);
    },
    [zoomLevel]
  );

  // === EVENT HANDLERS ===
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

  const handleClusterClick = useCallback((clusterId) => {
    // When a cluster is clicked, de-cluster it.
    setElements((prev) =>
      prev.flatMap((el) =>
        el.type === "cluster" && el.id === clusterId
          ? el.points.map((p) => ({ ...p, type: "point" }))
          : el
      )
    );
  }, []);

  const toggleManualMode = useCallback(() => {
    setIsManualMode((prev) => !prev);
    setSelectedColor(null);
  }, []);

  // === ZOOM HANDLERS ===
  const handleZoomIn = useCallback(
    () => setZoomLevel((prev) => Math.min(prev + 0.1, 2)),
    []
  );
  const handleZoomOut = useCallback(
    () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5)),
    []
  );

  // === RENDER ===
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
      />
    </div>
  );
};

export default App;
