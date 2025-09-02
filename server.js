const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/errorHandler');
const { socketAuth } = require('./middleware/socketAuth.middleware');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
connectDB();

// Express Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(helmet());
app.use(morgan('tiny'));



// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Test route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running successfully!' });
});

// Routes
app.use('/api/auth', authRoutes);


// Custom error handler
app.use(errorHandler);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
});

io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.email}`);

  socket.join(socket.user.id);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.email}`);
  });

  socket.on('message', (message) => {
    io.to(socket.user.id).emit('receive_message', {
      user: socket.user.email,
      text: message,
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));