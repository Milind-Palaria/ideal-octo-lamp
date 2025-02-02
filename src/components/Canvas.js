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
  isManualMode,
}) => {
  // Calculate the center of the canvas (used for scaling positions)
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
          "url('https://openmaptiles.org/img/home-banner-map.png')", // Replace with your background image URL
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

      {elements.map((element, i) => {
        // Calculate the absolute (scaled) position for each element
        const scaledX = centerX + (element.x - centerX) * zoomLevel;
        const scaledY = centerY + (element.y - centerY) * zoomLevel;

        if (element.type === "cluster") {
          return (
            <div
              key={element.id}
              onClick={(e) => {
                // Always allow clusters to be clicked so they can expand
                e.stopPropagation();
                handleClusterClick(element.id);
              }}
              style={{
                position: "absolute",
                left: scaledX - 25,
                top: scaledY - 25,
                cursor: "pointer",
                zIndex: i + 100,
                // Always enable pointer events on clusters so they catch clicks
                pointerEvents: "auto",
              }}
            >
              <ClusterDonut
                colorCounts={element.colorCounts}
                total={element.total}
              />
            </div>
          );
        } else {
          // Render individual points with a visible dotted circle for the radius.
          const pointSize = 10 * zoomLevel; // diameter of the actual point
          const radius = (element.radius || 20) * zoomLevel; // scaled radius

          return (
            <div
              key={element.id}
              // In manual mode, we want the click to fall through on individual points
              onClick={(e) => {
                if (!isManualMode) {
                  e.stopPropagation();
                }
              }}
              style={{
                position: "absolute",
                left: scaledX - radius,
                top: scaledY - radius,
                width: `${radius * 2}px`,
                height: `${radius * 2}px`,
                overflow: "visible",
                zIndex: i + 10,
                // Disable pointer events on individual points when in manual mode
                pointerEvents: isManualMode ? "none" : "auto",
              }}
            >
              {/* Dotted circle representing the point's radius */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  border: "1px dotted white",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 1,
                }}
              ></div>
              {/* The actual point */}
              <div
                style={{
                  width: `${pointSize}px`,
                  height: `${pointSize}px`,
                  borderRadius: "50%",
                  backgroundColor: element.color,
                  position: "absolute",
                  top: `calc(50% - ${pointSize / 2}px)`,
                  left: `calc(50% - ${pointSize / 2}px)`,
                  zIndex: 2,
                }}
              ></div>
            </div>
          );
        }
      })}
    </div>
  );
};

export default Canvas;
