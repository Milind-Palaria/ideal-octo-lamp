import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const App = () => {
  const [elements, setElements] = useState([]);
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const width = 1400;
  const height = 700;
  const distanceThreshold = 100;
  const baseGridSize = 50;

  // Add a point with zoom-adjusted coordinates
  const addPoint = (color, x, y) => {
    const newPoint = {
      id: uuidv4(),
      type: "point",
      x: x / zoomLevel, // Store original coordinates
      y: y / zoomLevel,
      color,
    };
    setElements((prev) => [...prev, newPoint]);
  };

  const handleCanvasClick = (e) => {
    if (isManualMode && selectedColor && e.target === e.currentTarget) {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addPoint(selectedColor, x, y);
    }
  };

  const toggleManualMode = () => {
    setIsManualMode((prev) => !prev);
    setSelectedColor(null);
  };

  const clusterElements = useCallback(() => {
    const points = elements.filter((el) => el.type === "point");
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

    setElements(clusters);
  }, [elements]);

  const handleClusterClick = (clusterId) => {
    setElements((prev) =>
      prev.flatMap((el) =>
        el.type === "cluster" && el.id === clusterId
          ? el.points.map((p) => ({ ...p, type: "point" }))
          : el
      )
    );
  };

  const renderDonutChart = (colorCounts, total) => (
    <svg width="50" height="50" viewBox="0 0 50 50">
      {Object.entries(colorCounts).reduce((acc, [color, count], i, arr) => {
        const percentage = (count / total) * 100;
        const offset = arr
          .slice(0, i)
          .reduce((sum, [_, c]) => sum + (c / total) * 100, 0);
        return [
          ...acc,
          <circle
            key={color}
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${percentage} ${100 - percentage}`}
            strokeDashoffset={-offset}
          />,
        ];
      }, [])}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="12"
        fontWeight="bold"
      >
        {total}
      </text>
    </svg>
  );

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));

  return (
    <div>
      <div style={{ padding: "20px" }}>
        <button
          onClick={() =>
            addPoint("red", Math.random() * width, Math.random() * height)
          }
        >
          Add Random Red
        </button>
        <button
          onClick={() =>
            addPoint("yellow", Math.random() * width, Math.random() * height)
          }
        >
          Add Random Yellow
        </button>
        <button
          onClick={() =>
            addPoint("green", Math.random() * width, Math.random() * height)
          }
        >
          Add Random Green
        </button>
        <button onClick={clusterElements}>Cluster Points</button>
        <button onClick={toggleManualMode}>
          {isManualMode ? "Cancel Manual" : "Add Manually"}
        </button>
        <button onClick={handleZoomIn}>Zoom In (+)</button>
        <button onClick={handleZoomOut}>Zoom Out (-)</button>
      </div>

      {isManualMode && (
        <div
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            margin: "10px",
            width: "200px",
          }}
        >
          <p>Select Color:</p>
          {["red", "yellow", "green"].map((color) => (
            <button
              key={color}
              style={{
                backgroundColor: color,
                color: color === "yellow" ? "black" : "white",
                margin: "5px",
              }}
              onClick={() => setSelectedColor(color)}
            >
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          position: "relative",
          width: `${width}px`,
          height: `${height}px`,
          border: "2px solid black",
          margin: "20px",
          backgroundColor: "black",
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: `${baseGridSize / zoomLevel}px ${
            baseGridSize / zoomLevel
          }px`,
        }}
        onClick={handleCanvasClick}
      >
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(255,255,255,0.8)",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          Zoom: {Math.round(zoomLevel * 100)}%
        </div>

        {elements.map((element) => {
          const scaledX = element.x * zoomLevel;
          const scaledY = element.y * zoomLevel;

          return element.type === "cluster" ? (
            <div
              key={element.id}
              onClick={(e) => {
                e.stopPropagation();
                handleClusterClick(element.id);
              }}
              style={{
                position: "absolute",
                left: scaledX - 25,
                top: scaledY - 25,
                cursor: "pointer",
              }}
            >
              {renderDonutChart(element.colorCounts, element.total)}
            </div>
          ) : (
            <div
              key={element.id}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                left: scaledX - 5 * zoomLevel,
                top: scaledY - 5 * zoomLevel,
                width: `${10 * zoomLevel}px`,
                height: `${10 * zoomLevel}px`,
                borderRadius: "50%",
                backgroundColor: element.color,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default App;
