import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const App = () => {
  const [elements, setElements] = useState([]);
  const width = 1400;
  const height = 700;
  const distanceThreshold = 100;

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
            count: cluster.length,
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

  return (
    <div>
      <div style={{ padding: "20px" }}>
        <button onClick={() => addPoint("red")}>Add Red Point</button>
        <button onClick={() => addPoint("yellow")}>Add Yellow Point</button>
        <button onClick={() => addPoint("green")}>Add Green Point</button>
        <button onClick={clusterElements}>Cluster Points</button>
      </div>
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
                  left: element.x - 15,
                  top: element.y - 15,
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#000",
                  fontWeight: "bold",
                }}
              >
                {element.count}
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
