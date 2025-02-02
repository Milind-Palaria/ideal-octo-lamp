// components/ClusterDonut.jsx
import React from "react";

const ClusterDonut = ({ colorCounts, total }) => {
  return (
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
};

export default ClusterDonut;
