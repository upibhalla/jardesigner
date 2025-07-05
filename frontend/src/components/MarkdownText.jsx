import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Typography, CircularProgress } from '@mui/material';

const MarkdownText = () => {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the markdown file from the public folder
	// Note that this does not use the /api/ prefix as it is a static
	// frontend asset. It lives in the public folder.
    fetch('documentation.md')
      .then(response => response.text())
      .then(text => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching documentation:", error);
        setMarkdown("# Error\n\nCould not load the documentation file.");
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        // The 'prose' class is a common convention for styling markdown output.
        // You would need to add CSS for it, but MUI's Typography handles most styling.
        <Typography component="div" className="prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </Typography>
      )}
    </Box>
  );
};

export default MarkdownText;
