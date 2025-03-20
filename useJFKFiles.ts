const searchFiles = async (query: string) => {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Server response:', responseText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search error:', error);
    throw new Error(`Failed to search files: ${error.message}`);
  }
} 