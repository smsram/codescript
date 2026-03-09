import React from 'react';
import './skeleton.css';

export default function Skeleton({ 
  width = '100%', 
  height = '20px', 
  borderRadius, 
  circle = false, 
  className = '', 
  style = {} 
}) {
  const mergedStyle = {
    width,
    height,
    borderRadius: circle ? '50%' : (borderRadius || '4px'),
    ...style
  };

  return <div className={`skeleton-box ${className}`} style={mergedStyle}></div>;
}