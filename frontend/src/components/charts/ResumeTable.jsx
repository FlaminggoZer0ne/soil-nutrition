import React from 'react';

const ResumeTable = ({ data }) => {
  // Define columns range: Month -3 to Month +20
  const ageMonths = [];
  for (let m = -3; m <= 20; m++) {
    ageMonths.push(m);
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '35px', textAlign: 'center', color: '#6b7280' }}>
        Tidak ada data resume pH. Data resume otomatis terbentuk ketika sampel memiliki referensi umur tanam.
      </div>
    );
  }

  // Get cell className based on pH value
  const getPHClass = (val) => {
    if (!val) return '';
    if (val < 5.0) return 'ph-cell red';
    if (val <= 5.5) return 'ph-cell yellow';
    if (val <= 6.0) return 'ph-cell lightgreen';
    return 'ph-cell darkgreen';
  };

  return (
    <div className="resume-table-wrapper animate-fade-in">
      <table className="resume-table">
        <thead>
          <tr>
            <th rowspan="2">PG</th>
            <th rowspan="2">Block</th>
            <th rowspan="2">Status</th>
            <th rowspan="2">Th Tanam</th>
            <th colspan={ageMonths.length}>Umur Tanam (Bulan)</th>
          </tr>
          <tr>
            {ageMonths.map(m => (
              <th key={m}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td className="block-label" style={{ textAlign: 'center' }}>{row.pg}</td>
              <td className="block-label" style={{ fontWeight: 'bold' }}>{row.block}</td>
              <td className="block-label" style={{ textAlign: 'center' }}>{row.status}</td>
              <td className="block-label" style={{ textAlign: 'center' }}>{row.tahun_tanam}</td>
              
              {ageMonths.map(m => {
                const phValue = row.ages[m];
                return (
                  <td 
                    key={m} 
                    className={getPHClass(phValue)}
                  >
                    {phValue ? phValue.toFixed(1) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResumeTable;
