/** 
 * 修正路径和解析逻辑
 */
function fetchAndParseData() {
    // 修正后的相对路径
    fetch('../Data/DataSet_test.TXT')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
      })
      .then(parseAndDisplayPackets)
      .catch(error => {
        console.error('Fetch Error:', error);
        document.getElementById('packetContainer').innerHTML = `
          <div class="error">
            Failed to load data: ${error.message}<br>
            Check: <br>
            1. Server is running from Firebase_webpage directory<br>
            2. Data/DataSet_test.txt file exists<br>
            3. File name case sensitivity
          </div>
        `;
      });
  }
  
  // 保持原有解析逻辑不变...
  
  /**
   * 增强解析逻辑
   */
  function parseAndDisplayPackets(content) {
    const container = document.getElementById('packetContainer');
    container.innerHTML = '';
  
    // 更严格的分割方式
    const packetBlocks = content.split(/\n\s*\n/).filter(Boolean);
  
    packetBlocks.forEach(block => {
      const packetDiv = document.createElement('div');
      packetDiv.className = 'packet';
  
      const lines = block.split('\n').filter(line => line.trim());
      
      // 结构化解析
      const headerData = parseHeaderLine(lines[0]);
      const metaData = parseMetaLine(lines[1]);
  
      packetDiv.innerHTML = `
        <div class="packet-header">
          <h3>Packet #${headerData.packetNumber}</h3>
          <span class="node-id">Node ${headerData.nodeID}</span>
        </div>
        <div class="sensor-data">
          <div class="data-item">
            <span class="label">Temperature:</span>
            <span class="value">${headerData.temperature} °F</span>
          </div>
          <div class="data-item">
            <span class="label">Light:</span>
            <span class="value">${headerData.light} lx</span>
          </div>
          <div class="data-item">
            <span class="label">Time:</span>
            <span class="value">${metaData.timestamp}</span>
          </div>
          <div class="data-item">
            <span class="label">Humidity:</span>
            <span class="value">${metaData.humidity}%</span>
          </div>
        </div>
      `;
  
      container.appendChild(packetDiv);
    });
  }
  
  // 解析头部行
  function parseHeaderLine(line) {
    const match = line.match(/Packet\s+#\s*(\d+).*?Node\s+(\d+).*?Temp\s+([\d.]+)\s*F.*?Light\s+([\d.]+)\s*lx/);
    return {
      packetNumber: match[1],
      nodeID: match[2],
      temperature: match[3],
      light: match[4]
    };
  }
  
  // 解析元数据行
  function parseMetaLine(line) {
    const match = line.match(/Time\s+(\d{2}:\d{2}:\d{2}).*?Humidity\s+(\d+)%/);
    return {
      timestamp: match[1],
      humidity: match[2]
    };
  }
  
  // 错误显示
  function showError(message) {
    const container = document.getElementById('packetContainer');
    container.innerHTML = `<div class="error">Error: ${message}</div>`;
  }
  
  // 初始化加载
  document.addEventListener('DOMContentLoaded', () => {
    fetchAndParseData();
    setInterval(fetchAndParseData, 5000);
  });