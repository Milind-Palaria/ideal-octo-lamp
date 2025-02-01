import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const App = () => {
  const [elements, setElements] = useState([]);
  const width = 1400;
  const height = 700;
  const distanceThreshold = 100;

  // Add a new point with a random position
  const addPoint = (color) => {
    const newPoint = {
      id: uuidv4(),
      type: "point",
      x: Math.random() * width,
      y: Math.random() * height,
      color,
    };
    setElements((prev) => [...prev, newPoint]);
  };

  // Cluster points based on proximity
  const clusterElements = useCallback(() => {
    const points = elements.filter((el) => el.type === "point");
    const clusters = [];
    const visited = new Set();

    points.forEach((point, i) => {
      if (!visited.has(point.id)) {
        visited.add(point.id);
        const cluster = [point];

        // Find all nearby points within the threshold
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

        // Create a cluster if there are multiple points
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
            colorCounts, // Store color counts for display
          });
        } else {
          // Keep single points as they are
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
        const colorCode = color[0].toUpperCase(); // Get first letter of color
        return `${count}${colorCode}`;
      })
      .join(" "); // Join with spaces
  };

  return (
    <div>
      {/* Buttons to add points and cluster them */}
      <div style={{ padding: "20px" }}>
        <button onClick={() => addPoint("red")}>Add Red Point</button>
        <button onClick={() => addPoint("yellow")}>Add Yellow Point</button>
        <button onClick={() => addPoint("green")}>Add Green Point</button>
        <button onClick={clusterElements}>Cluster Points</button>
      </div>

      {/* Container for points and clusters */}
      <div
        style={{
          position: "relative",
          width: `${width}px`,
          height: `${height}px`,
          border: "2px solid black",
          margin: "20px",
          backgroundColor: "black",
        }}
      >
        {elements.map((element) => {
          if (element.type === "cluster") {
            return (
              <div
                key={element.id}
                onClick={() => handleClusterClick(element.id)}
                style={{
                  position: "absolute",
                  left: element.x - 40, // Center the cluster
                  top: element.y - 20,
                  width: "80px", // Adjust size for text
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
          // Render individual points
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
