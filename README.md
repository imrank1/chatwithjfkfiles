# Chat with JFK Files

A web application that allows users to interact with the JFK files through a chat interface. The application processes and indexes the JFK files, enabling users to ask questions and receive relevant answers from the historical documents.

## Features

- Interactive chat interface for querying JFK files
- Real-time search and retrieval of relevant information
- Modern Material-UI based interface
- TypeScript for type safety and better development experience
- User authentication system

## Tech Stack

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- Marked (for markdown rendering)
- AJV (for JSON validation)

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database with pg driver
- Mistral AI and OpenAI integrations
- JWT for authentication

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- PostgreSQL database

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
npm install
# or
yarn install
```

4. Create a `.env` file in the root directory for frontend:
```
REACT_APP_API_URL=http://localhost:3001
```

5. Configure the backend `.env` file in the backend directory:
```
DATABASE_URL=your_postgresql_connection_string
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
AI_PROVIDER=mistral  # or 'openai' to use OpenAI
JWT_SECRET=your_jwt_secret_key
```

### Running the Application

1. Initialize the database:
```bash
cd backend
npm run db:init
```

2. Start the backend server:
```bash
cd backend
npm run dev
```

3. Initialize the JFK files data:
   - After the server is running, you need to initialize the JFK files data by calling the `/api/init-files` endpoint
   - This will fetch, process, and store the JFK files from the source repository
   - You can do this by making an authenticated POST request to `http://localhost:3001/api/init-files`
   - Or use the frontend interface which should have a button to initialize the files

4. Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`, with the backend running on port 3001.

## Project Structure

```
chat-with-jfk/
├── backend/             # Node.js backend server
│   ├── src/             # Backend source code
│   │   ├── server.ts    # Express server setup
│   │   ├── db/          # Database related code
│   │   └── utils/       # Utility functions
│   ├── package.json     # Backend dependencies
│   └── tsconfig.json    # TypeScript configuration for backend
├── src/                 # React frontend source code
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── App.tsx          # Main application component
│   └── types.ts         # TypeScript type definitions
├── public/              # Static assets
├── build/               # Production build output
├── package.json         # Frontend dependencies and scripts
└── tsconfig.json        # TypeScript configuration for frontend
```

## Authentication

The application uses JWT-based authentication. For more details, refer to the AUTHENTICATION.md file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- JFK Files source: [GitHub Repository](https://github.com/amasad/jfk_files/)
- Material-UI for the beautiful components
- React team for the amazing framework 