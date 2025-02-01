import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const App = () => {
  const [elements, setElements] = useState([]);
  const [isManualMode, setIsManualMode] = useState(false); // Toggle manual mode
  const [selectedColor, setSelectedColor] = useState(null); // Track selected color
  const width = 1400;
  const height = 700;
  const distanceThreshold = 100;

  // Add a point at a specific position
  const addPoint = (color, x, y) => {
    const newPoint = {
      id: uuidv4(),
      type: "point",
      x,
      y,
      color,
    };
    setElements((prev) => [...prev, newPoint]);
  };

  // Handle canvas click for manual point placement
  const handleCanvasClick = (e) => {
    if (isManualMode && selectedColor) {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left; // Calculate X position relative to canvas
      const y = e.clientY - rect.top; // Calculate Y position relative to canvas
      addPoint(selectedColor, x, y);
    }
  };

  // Toggle manual mode and show color selection
  const toggleManualMode = () => {
    setIsManualMode((prev) => !prev);
    setSelectedColor(null); // Reset selected color when toggling
  };

  // Cluster points (same as before)
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

          const clusterX =
            cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length;
          const clusterY =
            cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length;

          clusters.push({
            id: uuidv4(),
            type: "cluster",
            points: cluster,
            x: clusterX,
            y: clusterY,
            colorCounts,
          });
        } else {
          clusters.push(point);
        }
      }
    });

    setElements(clusters);
  }, [elements]);

  // Handle cluster click to expand it back into individual points
  const handleClusterClick = (clusterId) => {
    setElements((prev) =>
      prev.flatMap((el) => {
        if (el.type === "cluster" && el.id === clusterId) {
          return el.points.map((point) => ({
            ...point,
            type: "point",
          }));
        }
        return el;
      })
    );
  };

  // Format color counts into a string like "1R 2Y 2G"
  const formatColorCounts = (colorCounts) => {
    return Object.entries(colorCounts)
      .map(([color, count]) => {
        const colorCode = color[0].toUpperCase();
        return `${count}${colorCode}`;
      })
      .join(" ");
  };

  return (
    <div>
      {/* Buttons to add points and cluster them */}
      <div style={{ padding: "20px" }}>
        <button
          onClick={() =>
            addPoint("red", Math.random() * width, Math.random() * height)
          }
        >
          Add Random Red Point
        </button>
        <button
          onClick={() =>
            addPoint("yellow", Math.random() * width, Math.random() * height)
          }
        >
          Add Random Yellow Point
        </button>
        <button
          onClick={() =>
            addPoint("green", Math.random() * width, Math.random() * height)
          }
        >
          Add Random Green Point
        </button>
        <button onClick={clusterElements}>Cluster Points</button>
        <button onClick={toggleManualMode}>
          {isManualMode ? "Cancel Manual Mode" : "Add Points Manually"}
        </button>
      </div>

      {/* Color selection for manual mode */}
      {isManualMode && (
        <div
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            margin: "10px",
            width: "200px",
          }}
        >
          <p>Select a color:</p>
          <button
            style={{ backgroundColor: "red", color: "white", margin: "5px" }}
            onClick={() => setSelectedColor("red")}
          >
            Red
          </button>
          <button
            style={{ backgroundColor: "yellow", margin: "5px" }}
            onClick={() => setSelectedColor("yellow")}
          >
            Yellow
          </button>
          <button
            style={{ backgroundColor: "green", color: "white", margin: "5px" }}
            onClick={() => setSelectedColor("green")}
          >
            Green
          </button>
        </div>
      )}

      {/* Canvas for points and clusters */}
      <div
        style={{
          position: "relative",
          width: `${width}px`,
          height: `${height}px`,
          border: "2px solid black",
          margin: "20px",
          backgroundColor: "black",
        }}
        onClick={handleCanvasClick}
      >
        {elements.map((element) => {
          if (element.type === "cluster") {
            return (
              <div
                key={element.id}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event from bubbling up to the canvas
                  handleClusterClick(element.id);
                }}
                style={{
                  position: "absolute",
                  left: element.x - 40,
                  top: element.y - 20,
                  width: "80px",
                  height: "40px",
                  borderRadius: "10px",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#000",
                  fontWeight: "bold",
                  fontSize: "14px",
                  padding: "5px",
                  textAlign: "center",
                }}
              >
                {formatColorCounts(element.colorCounts)}
              </div>
            );
          }
          return (
            <div
              key={element.id}
              style={{
                position: "absolute",
                left: element.x - 5,
                top: element.y - 5,
                width: "10px",
                height: "10px",
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
