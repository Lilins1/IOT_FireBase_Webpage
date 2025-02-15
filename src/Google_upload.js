const { Storage } = require('@google-cloud/storage');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
const port = 3000;

const bucketName = 'pub-sub-senso';
const storage = new Storage({ 
  keyFilename: ".env/data-segment-450509-s6-cab3f8e582fc.json" 
});

// API to list files
app.get('/api/files', async (req, res) => {
  try {
    const date = req.query.date;
    const prefix = date ? `DataInJson/${date}/` : 'DataInJson/';
    const [files] = await storage.bucket(bucketName).getFiles({ prefix });
    
    const filteredFiles = files
      .filter(file => !file.name.endsWith('/'))
      .map(file => ({
        name: file.name.split('/').pop(),
        path: file.name
      }));
    
    res.json(filteredFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API to get file content
app.get('/api/file', async (req, res) => {
  try {
    const filePath = req.query.path;
    const [file] = await storage.bucket(bucketName).file(filePath).download();
    res.json(JSON.parse(file.toString()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});