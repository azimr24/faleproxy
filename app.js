const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to fetch and modify content
app.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Fetch the content from the provided URL
    const response = await axios.get(url);
    const html = response.data;

    // Use cheerio to parse HTML and selectively replace text content, not URLs
    const $ = cheerio.load(html);
    
    // Keep track of replacements
    let replacementCount = 0;
    
    // Function to replace text but skip URLs and attributes
    function replaceYaleWithFale(i, el) {
      if ($(el).children().length === 0 || $(el).text().trim() !== '') {
        // Get the HTML content of the element
        let content = $(el).html();
        
        // Only process if it's a text node
        if (content && $(el).children().length === 0) {
          // Replace Yale with Fale in text content only
          content = content.replace(/Yale/g, (match) => {
            replacementCount++;
            return 'Fale';
          }).replace(/YALE/g, (match) => {
            replacementCount++;
            return 'FALE';
          }).replace(/yale/g, (match) => {
            replacementCount++;
            return 'fale';
          });
          $(el).html(content);
        }
      }
    }
    
    // Process text nodes in the body
    $('body *').contents().filter(function() {
      return this.nodeType === 3; // Text nodes only
    }).each(function() {
      // Replace text content but not in URLs or attributes
      const text = $(this).text();
      // Using case-preserving replacements with regular expressions
      const newText = text.replace(/Yale/g, (match) => {
        replacementCount++;
        return 'Fale';
      }).replace(/YALE/g, (match) => {
        replacementCount++;
        return 'FALE';
      }).replace(/yale/g, (match) => {
        replacementCount++;
        return 'fale';
      });
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    // Process title separately
    const title = $('title').text()
                 .replace(/Yale/g, (match) => {
                   replacementCount++;
                   return 'Fale';
                 })
                 .replace(/YALE/g, (match) => {
                   replacementCount++;
                   return 'FALE';
                 })
                 .replace(/yale/g, (match) => {
                   replacementCount++;
                   return 'fale';
                 });
    $('title').text(title);
    
    return res.json({ 
      success: true, 
      content: $.html(),
      title: title,
      originalUrl: url,
      replacementCount: replacementCount
    });
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    return res.status(500).json({ 
      error: `Failed to fetch content: ${error.message}` 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Faleproxy server running at http://localhost:${PORT}`);
}).on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    const newPort = PORT + 1;
    console.log(`Port ${PORT} is in use, attempting to use port ${newPort} instead...`);
    app.listen(newPort, () => {
      console.log(`Faleproxy server running at http://localhost:${newPort}`);
    });
  } else {
    console.error('Failed to start server:', e.message);
  }
});
