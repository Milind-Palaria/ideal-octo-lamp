// components/Canvas.jsx
import React from "react";
import ClusterDonut from "./ClusterDonut";

const Canvas = ({
  width,
  height,
  elements,
  zoomLevel,
  handleCanvasClick,
  handleClusterClick,
}) => {
  // Calculate the center of the canvas for scaling
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <div
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        border: "2px solid black",
        margin: "20px",
        backgroundColor: "black",
        backgroundImage:
          "url('https://openmaptiles.org/img/home-banner-map.png')", // Replace with your image URL
        backgroundSize: `${width * zoomLevel}px ${height * zoomLevel}px`,
        backgroundPosition: "center",
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
        // Adjust positions relative to the canvas center and zoom
        const scaledX = centerX + (element.x - centerX) * zoomLevel;
        const scaledY = centerY + (element.y - centerY) * zoomLevel;

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
            <ClusterDonut
              colorCounts={element.colorCounts}
              total={element.total}
            />
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
  );
};

export default Canvas;
