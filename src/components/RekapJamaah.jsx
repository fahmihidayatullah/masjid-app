import React, { useState, useEffect } from 'react';
import '../styles/RekapJamaah.css';

const PRAYERS = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

function getAllRekapData() {
  const data = [];
  for (let i = 0; i < 90; i++) { // 3 bulan ke belakang
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `prayerCounts_${d.toISOString().slice(0,10)}`;
    const val = localStorage.getItem(key);
    if (val) {
      const parsed = JSON.parse(val);
      const total = Object.values(parsed).reduce((sum, count) => sum + (count || 0), 0);
      data.push({
        date: d.toISOString().slice(0,10),
        ...parsed,
        total
      });
    }
  }
  return data.sort((a, b) => b.date.localeCompare(a.date)); // Sort descending
}

const RekapJamaah = ({ onBack }) => {
  const [rekap, setRekap] = useState([]);
  const [filteredRekap, setFilteredRekap] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPrayer, setSelectedPrayer] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'

  useEffect(() => {
    const data = getAllRekapData();
    setRekap(data);
    setFilteredRekap(data);
    
    // Set default date range (last 30 days)
    if (data.length > 0) {
      setEndDate(data[0].date);
      const startD = new Date(data[0].date);
      startD.setDate(startD.getDate() - 30);
      setStartDate(startD.toISOString().slice(0, 10));
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [startDate, endDate, selectedPrayer, rekap]);

  const applyFilters = () => {
    let filtered = [...rekap];
    
    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(row => row.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(row => row.date <= endDate);
    }
    
    setFilteredRekap(filtered);
  };

  const exportToCSV = () => {
    if (filteredRekap.length === 0) {
      alert('Tidak ada data untuk di-export');
      return;
    }
    
    // Create CSV content
    const headers = ['Tanggal', ...PRAYERS, 'Total'];
    const rows = filteredRekap.map(row => [
      row.date,
      ...PRAYERS.map(p => row[p] ?? 0),
      row.total
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_jamaah_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatistics = () => {
    if (filteredRekap.length === 0) return null;
    
    const stats = {
      totalDays: filteredRekap.length,
      prayers: {}
    };
    
    PRAYERS.forEach(prayer => {
      const counts = filteredRekap.map(row => row[prayer] || 0);
      const total = counts.reduce((sum, c) => sum + c, 0);
      const avg = total / filteredRekap.length;
      const max = Math.max(...counts);
      const min = Math.min(...counts);
      
      stats.prayers[prayer] = {
        total,
        average: Math.round(avg * 10) / 10,
        max,
        min
      };
    });
    
    const totalAll = filteredRekap.reduce((sum, row) => sum + row.total, 0);
    stats.grandTotal = totalAll;
    stats.dailyAverage = Math.round((totalAll / filteredRekap.length) * 10) / 10;
    
    return stats;
  };

  const stats = getStatistics();

  const renderBarChart = () => {
    if (filteredRekap.length === 0) return null;
    
    // Get last 30 days or less
    const chartData = filteredRekap.slice(0, 30).reverse();
    const maxValue = Math.max(...chartData.map(row => row.total), 1);
    
    return (
      <div className="chart-container">
        <h3>Grafik Jamaah Harian (30 Hari Terakhir)</h3>
        <div className="bar-chart">
          {chartData.map((row, idx) => (
            <div key={row.date} className="bar-item">
              <div className="bar-wrapper">
                {PRAYERS.map((prayer, pIdx) => {
                  const count = row[prayer] || 0;
                  const height = (count / maxValue) * 100;
                  const colors = {
                    Subuh: '#4A90E2',
                    Dzuhur: '#F5A623',
                    Ashar: '#7ED321',
                    Maghrib: '#D0021B',
                    Isya: '#9013FE'
                  };
                  
                  return (
                    <div
                      key={prayer}
                      className="bar-segment"
                      style={{
                        height: `${height}%`,
                        backgroundColor: colors[prayer],
                        bottom: `${PRAYERS.slice(0, pIdx).reduce((sum, p) => sum + ((row[p] || 0) / maxValue) * 100, 0)}%`
                      }}
                      title={`${prayer}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="bar-label">{row.date.slice(5)}</div>
              <div className="bar-value">{row.total}</div>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          {PRAYERS.map(prayer => {
            const colors = {
              Subuh: '#4A90E2',
              Dzuhur: '#F5A623',
              Ashar: '#7ED321',
              Maghrib: '#D0021B',
              Isya: '#9013FE'
            };
            return (
              <div key={prayer} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: colors[prayer] }}></div>
                <span>{prayer}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPrayerChart = () => {
    if (!stats) return null;
    
    const maxTotal = Math.max(...Object.values(stats.prayers).map(p => p.total), 1);
    
    return (
      <div className="prayer-chart">
        <h3>Total Jamaah per Waktu Sholat</h3>
        <div className="prayer-bars">
          {PRAYERS.map(prayer => {
            const prayerStats = stats.prayers[prayer];
            const percentage = (prayerStats.total / maxTotal) * 100;
            const colors = {
              Subuh: '#4A90E2',
              Dzuhur: '#F5A623',
              Ashar: '#7ED321',
              Maghrib: '#D0021B',
              Isya: '#9013FE'
            };
            
            return (
              <div key={prayer} className="prayer-bar-item">
                <div className="prayer-bar-label">{prayer}</div>
                <div className="prayer-bar-wrapper">
                  <div
                    className="prayer-bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: colors[prayer]
                    }}
                  >
                    <span className="prayer-bar-value">{prayerStats.total}</span>
                  </div>
                </div>
                <div className="prayer-bar-avg">Avg: {prayerStats.average}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="rekap-container">
      <div className="rekap-header">
        <h2>📊 Rekapitulasi Jamaah</h2>
        <button onClick={onBack} className="btn-back">← Kembali</button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Dari Tanggal:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label>Sampai Tanggal:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label>Tampilan:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="filter-input"
          >
            <option value="table">Tabel</option>
            <option value="chart">Grafik</option>
          </select>
        </div>
        <button onClick={exportToCSV} className="btn-export">
          📥 Export CSV
        </button>
      </div>

      {/* Statistics Summary */}
      {stats && (
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-label">Total Hari</div>
            <div className="stat-value">{stats.totalDays}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Jamaah</div>
            <div className="stat-value">{stats.grandTotal}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rata-rata/Hari</div>
            <div className="stat-value">{stats.dailyAverage}</div>
          </div>
        </div>
      )}

      {/* View Mode: Table or Chart */}
      {viewMode === 'table' ? (
        <>
          {/* Table View */}
          <div className="table-wrapper">
            <table className="rekap-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  {PRAYERS.map(p => (
                    <th key={p}>{p}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredRekap.map(row => (
                  <tr key={row.date}>
                    <td className="date-cell">{row.date}</td>
                    {PRAYERS.map(p => (
                      <td key={p} className="count-cell">{row[p] ?? 0}</td>
                    ))}
                    <td className="total-cell">{row.total}</td>
                  </tr>
                ))}
                {filteredRekap.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      Belum ada data rekap jamaah.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Prayer Statistics Table */}
          {stats && (
            <div className="stats-table-wrapper">
              <h3>Statistik per Waktu Sholat</h3>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Waktu Sholat</th>
                    <th>Total</th>
                    <th>Rata-rata</th>
                    <th>Maximum</th>
                    <th>Minimum</th>
                  </tr>
                </thead>
                <tbody>
                  {PRAYERS.map(prayer => {
                    const prayerStats = stats.prayers[prayer];
                    return (
                      <tr key={prayer}>
                        <td className="prayer-name">{prayer}</td>
                        <td>{prayerStats.total}</td>
                        <td>{prayerStats.average}</td>
                        <td>{prayerStats.max}</td>
                        <td>{prayerStats.min}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Chart View */}
          {renderBarChart()}
          {renderPrayerChart()}
        </>
      )}
    </div>
  );
};

export default RekapJamaah;
