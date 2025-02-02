// src/components/Canvas.jsx
import React from "react";
import ClusterDonut from "./ClusterDonut";

// Define a default value for points' intrinsic radius.
const defaultPointRadius = 20;

const Canvas = ({
  width,
  height,
  elements,
  zoomLevel,
  handleCanvasClick,
  handleClusterClick,
  isManualMode,
}) => {
  // Calculate the center of the canvas (used for converting data coordinates to screen coordinates)
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
          "url('https://openmaptiles.org/img/home-banner-map.png')", // Replace with your background URL
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
        // Convert the element’s data coordinates to screen coordinates.
        const scaledX = centerX + (element.x - centerX) * zoomLevel;
        const scaledY = centerY + (element.y - centerY) * zoomLevel;

        if (element.type === "cluster") {
          // For clusters, the intrinsic (data) radius was set to fixedClusterRadius/zoomLevel.
          // When rendered, multiply by zoomLevel to get on-screen radius:
          const clusterRadiusScreen = element.radius * zoomLevel; // should equal fixedClusterRadius
          return (
            <div
              key={element.id}
              onClick={(e) => {
                e.stopPropagation();
                handleClusterClick(element.id);
              }}
              style={{
                position: "absolute",
                left: scaledX - clusterRadiusScreen,
                top: scaledY - clusterRadiusScreen,
                width: clusterRadiusScreen * 2,
                height: clusterRadiusScreen * 2,
                cursor: "pointer",
                zIndex: i + 100,
                pointerEvents: "auto", // clusters remain clickable even in manual mode
              }}
            >
              {/* Dotted circle representing the cluster’s fixed on-screen radius, now with a 3px black border */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  border: "3px solid black",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 1,
                }}
              ></div>
              {/* Cluster donut chart rendered in a fixed-size container (e.g. 50px by 50px) */}
              <div
                style={{
                  position: "absolute",
                  top: "calc(50% - 25px)",
                  left: "calc(50% - 25px)",
                  width: "50px",
                  height: "50px",
                  zIndex: 2,
                }}
              >
                <ClusterDonut
                  colorCounts={element.colorCounts}
                  total={element.total}
                />
              </div>
            </div>
          );
        } else {
          // For individual points, their on-screen dotted circle radius is (intrinsicRadius * zoomLevel).
          const pointSize = 10 * zoomLevel; // inner point size (scaled)
          const pointRadiusScreen =
            (element.radius || defaultPointRadius) * zoomLevel;
          return (
            <div
              key={element.id}
              onClick={(e) => {
                if (!isManualMode) e.stopPropagation();
              }}
              style={{
                position: "absolute",
                left: scaledX - pointRadiusScreen,
                top: scaledY - pointRadiusScreen,
                width: `${pointRadiusScreen * 2}px`,
                height: `${pointRadiusScreen * 2}px`,
                overflow: "visible",
                zIndex: i + 10,
                pointerEvents: isManualMode ? "none" : "auto",
              }}
            >
              {/* Dotted circle for the point’s radius (scaled) with a 2px black border */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  border: "2px solid black",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 1,
                }}
              ></div>
              {/* The actual point (centered) */}
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
