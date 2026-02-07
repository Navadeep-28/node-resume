// frontend/src/services/reportService.js

// Export data as JSON file
export const exportAsJSON = (data, filename = 'report') => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
};

// Export data as CSV file
export const exportAsCSV = (data, filename = 'report') => {
  if (!Array.isArray(data) || data.length === 0) {
    console.error('Data must be a non-empty array');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  downloadBlob(blob, `${filename}.csv`);
};

// Export as HTML report
export const exportAsHTML = (reportData, filename = 'report') => {
  const html = generateHTMLReport(reportData);
  const blob = new Blob([html], { type: 'text/html' });
  downloadBlob(blob, `${filename}.html`);
};

// Open print dialog for PDF export
export const exportAsPDF = (reportData) => {
  const html = generateHTMLReport(reportData);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// Helper function to download blob
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Generate HTML report
const generateHTMLReport = (data) => {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume Screening Report - ${date}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      padding: 50px;
      border-radius: 24px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.15);
    }
    .header {
      text-align: center;
      margin-bottom: 50px;
      padding-bottom: 30px;
      border-bottom: 3px solid #667eea;
    }
    .header h1 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header p { color: #64748b; font-size: 14px; }
    .section { margin-bottom: 40px; }
    .section h2 {
      color: #1e293b;
      font-size: 22px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    .stat-card h3 { font-size: 36px; margin-bottom: 5px; }
    .stat-card p { font-size: 14px; opacity: 0.9; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      border-radius: 12px;
      overflow: hidden;
    }
    th, td {
      padding: 15px 20px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
    }
    tr:hover { background: #f8fafc; }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-yellow { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 15px;
    }
    .skill-tag {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      color: #667eea;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid rgba(102, 126, 234, 0.3);
    }
    .footer {
      margin-top: 50px;
      padding-top: 25px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
    @media print {
      body { padding: 0; background: white; }
      .container { box-shadow: none; padding: 20px; }
      .stat-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Resume Screening Report</h1>
      <p>Generated on ${date}</p>
    </div>

    <div class="section">
      <h2>Overview Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${data.overview?.totalResumes || 0}</h3>
          <p>Total Resumes</p>
        </div>
        <div class="stat-card">
          <h3>${data.overview?.processedResumes || 0}</h3>
          <p>Processed</p>
        </div>
        <div class="stat-card">
          <h3>${data.overview?.activeJobs || 0}</h3>
          <p>Active Jobs</p>
        </div>
        <div class="stat-card">
          <h3>${data.overview?.averageScore || 0}%</h3>
          <p>Avg Score</p>
        </div>
      </div>
    </div>

    ${data.topSkills ? `
    <div class="section">
      <h2>Top Skills</h2>
      <div class="skills-list">
        ${data.topSkills.slice(0, 15).map(skill => `
          <span class="skill-tag">${skill._id} (${skill.count})</span>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${data.experienceDistribution ? `
    <div class="section">
      <h2>Experience Distribution</h2>
      <table>
        <thead>
          <tr>
            <th>Experience Level</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${data.experienceDistribution.map(exp => {
            const total = data.experienceDistribution.reduce((sum, e) => sum + e.count, 0);
            const percentage = total > 0 ? ((exp.count / total) * 100).toFixed(1) : 0;
            return `
              <tr>
                <td>${exp._id || 'Unknown'}</td>
                <td>${exp.count}</td>
                <td>${percentage}%</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${data.recommendationDistribution ? `
    <div class="section">
      <h2>Recommendation Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          ${data.recommendationDistribution.map(rec => `
            <tr>
              <td>
                <span class="badge ${
                  rec._id === 'Highly Recommended' ? 'badge-green' :
                  rec._id === 'Recommended' ? 'badge-blue' :
                  rec._id === 'Potential' ? 'badge-yellow' : 'badge-red'
                }">${rec._id}</span>
              </td>
              <td>${rec.count}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${data.recentResumes ? `
    <div class="section">
      <h2>Recent Candidates</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Score</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${data.recentResumes.map(resume => `
            <tr>
              <td>${resume.analysis?.contact?.name || resume.originalName || 'Unknown'}</td>
              <td>
                <span class="badge ${
                  (resume.matchScore?.overallScore || 0) >= 75 ? 'badge-green' :
                  (resume.matchScore?.overallScore || 0) >= 50 ? 'badge-blue' :
                  (resume.matchScore?.overallScore || 0) >= 25 ? 'badge-yellow' : 'badge-red'
                }">${resume.matchScore?.overallScore || 0}%</span>
              </td>
              <td>${new Date(resume.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <p>Generated by ResumeAI - Smart Resume Screening System</p>
    </div>
  </div>
</body>
</html>
  `;
};

export default {
  exportAsJSON,
  exportAsCSV,
  exportAsHTML,
  exportAsPDF
};