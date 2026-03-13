import React from 'react';
import '../styles/setting.css';
import logo from '../assets/logo.png';

const About = ({ setCurrentPage }) => (
  <div className="setting-container" style={{ maxWidth: 600, margin: '40px auto', background: '#fffbe9', borderRadius: 18, boxShadow: '0 2px 16px #e0d6b6', padding: '32px 28px 24px 28px' }}>
    <div style={{ textAlign: 'center', marginBottom: 18 }}>
      <img src={logo} alt="Logo DKM Al Muqorrobin" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 6, borderRadius: 12, boxShadow: '0 2px 8px #e0d6b6' }} />
      <h1 className="setting-title" style={{ fontSize: '2.1rem', color: '#7c5a1a', margin: 0, letterSpacing: 1 }}>Aplikasi Masjid Online</h1>
      <div style={{ color: '#a88c3b', fontWeight: 500, fontSize: '1.1rem', marginTop: 2 }}>Jadwal Sholat, Info Kegiatan, Streaming Kajian</div>
    </div>
    <div style={{ fontSize: '1.08rem', color: '#5D3B0F', marginBottom: 24, lineHeight: 1.7 }}>
      <p style={{ marginBottom: 16, textAlign: 'justify' }}>
        <strong>Aplikasi Masjid Online</strong> adalah aplikasi open source untuk kebutuhan masjid modern: menampilkan jadwal sholat, info kegiatan, dan streaming kajian secara dinamis di layar TV atau proyektor masjid.
      </p>
      <ul style={{ margin: '1.2em 0 1.2em 1.5em', color: '#3a2200', fontSize: '1.04rem', lineHeight: 1.6, paddingLeft: 18 }}>
        <li>Jadwal sholat otomatis (API MyQuran)</li>
        <li>Info kegiatan & event masjid</li>
        <li>Streaming kajian (YouTube/RTSP/Google Drive)</li>
        <li>Running text & pengumuman</li>
        <li>Background harian dinamis</li>
        <li>Responsive, mudah diatur via halaman Setting</li>
      </ul>
      <hr style={{ border: 0, borderTop: '1.5px dashed #e0d6b6', margin: '24px 0 18px 0' }} />
      <div style={{ background: '#f7f3e3', borderRadius: 10, padding: '12px 18px', margin: '0 0 18px 0', color: '#7c5a1a', fontSize: '1.04rem', boxShadow: '0 1px 4px #e0d6b6' }}>
        <strong>Tentang Masjid Al Muqorrobin:</strong><br />
        Masjid Al Muqorrobin merupakan masjid yang terletak di area kantor Telkom Kebayoran Baru, Jakarta Selatan. Masjid ini menjadi pusat kegiatan ibadah, kajian, dan aktivitas keagamaan bagi karyawan di Telkom Indonesia dan masyarakat sekitar.
      </div>
      <hr style={{ border: 0, borderTop: '1.5px dashed #e0d6b6', margin: '24px 0 18px 0' }} />
      <div style={{ marginBottom: 10 }}>
        <strong>Pengembang:</strong> <a href="https://github.com/fahmihidayatullah" target="_blank" rel="noopener noreferrer" style={{ color: '#A29B11', textDecoration: 'underline' }}>Fahmi Hidayatullah</a>
      </div>
      <div style={{ marginBottom: 10 }}>
        <strong>Kontribusi & Saran:</strong> Silakan fork, pull request, atau kirim issue melalui <a href="https://github.com/fahmihidayatullah/masjid-app" target="_blank" rel="noopener noreferrer" style={{ color: '#A29B11', textDecoration: 'underline' }}>halaman GitHub Masjid App</a>.
      </div>
      <div style={{ fontSize: '0.97em', color: '#A29B11', marginTop: 18, textAlign: 'center' }}>
        &copy; {new Date().getFullYear()} Masjid Al Muqorrobin. Bebas digunakan & dimodifikasi untuk kemaslahatan umat.
      </div>
    </div>
    <button className="setting-button" style={{ width: 120, margin: '0 auto', display: 'block', marginTop: 8 }} onClick={() => setCurrentPage('welcome')}>
      Kembali
    </button>
  </div>
);

export default About;
