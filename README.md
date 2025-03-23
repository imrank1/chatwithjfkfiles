# Chat with JFK Files

A web application that allows users to interact with the JFK files through a chat interface. The application processes and indexes the JFK files , enabling users to ask questions and receive relevant answers from the historical documents.

## Features

- Interactive chat interface for querying JFK files
- Real-time search and retrieval of relevant information
- Modern Material-UI based interface
- TypeScript for type safety and better development experience

## Tech Stack

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- Marked (for markdown rendering)
- AJV (for JSON validation)

### Backend
- Python-based server for serving the JFK files
- Efficient document processing and indexing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python 3.x
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chat-with-jfk.git
cd chat-with-jfk
```

2. Install frontend dependencies:
```bash
npm install
# or
yarn install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with necessary environment variables:
```
REACT_APP_API_URL=http://localhost:5000
```

### Running the Application

1. Start the backend server:
```bash
cd backend
python app.py
```

2. In a new terminal, start the frontend development server:
```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
chat-with-jfk/
├── backend/           # Node backend server
├── src/              # React frontend source code
├── public/           # Static assets
├── build/            # Production build output
├── package.json      # Frontend dependencies and scripts
├── requirements.txt  # Backend dependencies
└── tsconfig.json     # TypeScript configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- JFK Files source: [GitHub Repository](https://github.com/amasad/jfk_files/)
- Material-UI for the beautiful components
- React team for the amazing framework 