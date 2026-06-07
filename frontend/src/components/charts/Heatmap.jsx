import React from 'react';

const Heatmap = ({ data, onSelectBlock }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>
        Tidak ada data pH tanah untuk divisualisasikan dalam heatmap.
      </div>
    );
  }

  return (
    <div className="heatmap-grid animate-fade-in">
      {data.map((item, index) => (
        <div 
          key={index} 
          className={`heatmap-node ${item.colorClass}`}
          onClick={() => onSelectBlock && onSelectBlock(item)}
          title={`PG: ${item.pg} | Status: ${item.status_lokasi} | pH: ${item.ph}`}
        >
          <div className="heatmap-node-title">{item.block}</div>
          <div className="heatmap-node-ph">{item.ph.toFixed(1)}</div>
          <div className="heatmap-node-desc">{item.status}</div>
        </div>
      ))}
    </div>
  );
};

export default Heatmap;
