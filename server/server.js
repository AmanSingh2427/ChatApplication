// Server Setup
const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = 5000;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://192.168.1.129:3000', // Update with your frontend URL
    methods: ['GET', 'POST'],
  },
});
const SECRET_KEY = 'your_jwt_secret_key';

// Database connection pool
const pool = new Pool({
  user: 'postgres',
  host: '192.168.1.6',
  database: 'php_training',
  schema: 'aman',
  password: 'mawai123',
  port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'uploads'))); // Serve static files from 'uploads' directory

// const jwt = require('jsonwebtoken');

// const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  console.log('Token:', token);

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, 'your_jwt_secret_key', (err, decoded) => {
    if (err) {
      console.log('Invalid token:', err);
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.userId = decoded.id;
    console.log('User ID:', req.userId);
    next();
  });
};



// Function to test the database connection
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful:', res.rows[0]);
  } catch (err) {
    console.error('Connection error', err);
  }
};

// Call the test function
testConnection();

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to save files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`); // Filename with timestamp
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed!'));
  }
});

// File upload and form data handling route
app.post('/signup', upload.single('file'), async (req, res) => {
  const { fullName, email, username, password } = req.body;
  const profile_picture = req.file ? req.file.filename : null;

  // Validation
  if (!fullName || !email || !username || !password || !profile_picture) {
    return res.status(400).send('All fields are required.');
  }
        
  try {
    // Hash the password
    const result = await pool.query('SELECT * FROM aman.chatusers WHERE email = $1', [email]);
 
    const emailCheck = await pool.query('SELECT * FROM aman.chatusers WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const query = `
      INSERT INTO aman.chatusers (fullname, email, username, password, profile_picture)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [fullName, email, username, hashedPassword, profile_picture];
    await pool.query(query, values);

    res.status(201).send('User registered successfully!');
  } catch (err) {
    console.error('Error saving user to database', err);
    res.status(500).send('Server error');
  }
});


// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM aman.chatusers WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        username: user.username,
        profilePicture: user.profile_picture,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});



// Create a new endpoint to get the list of users and groups 
app.get('/users', verifyToken, async (req, res) => {
  try {
    const userId = req.userId; // Get the userId from the token
    
    // Query to fetch users and count of unread messages for each user
    const result = await pool.query(`
      SELECT u.id, u.username, u.profile_picture, u.fullname,
             COALESCE((
               SELECT COUNT(*)
               FROM aman.chat_messages m
               WHERE m.receiver_id = $1 AND m.sender_id = u.id AND m.read = FALSE
             ), 0) AS unread_messages
      FROM aman.chatusers u
      WHERE u.id != $1
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users', err);
    res.status(500).send('Server error');
  }
});





// Endpoint to get user details by ID
app.get('/users/:id', verifyToken, async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query('SELECT id, username, fullname, profile_picture FROM aman.chatusers WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user details', err);
    res.status(500).send('Server error');
  }
});




const connectedUsers = {};

// Endpoint to handle sending messages for a single user
app.post('/send-message', verifyToken, (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.userId; // User ID set by verifyToken middleware

  if (!receiverId || !message) {
    return res.status(400).json({ message: 'Receiver and message are required' });
  }

  pool.query(
    'INSERT INTO aman.chat_messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *',
    [senderId, receiverId, message],
    (err, result) => {
      if (err) {
        console.error('Error storing message', err);
        return res.status(500).send('Server error');
      }

      const newMessage = result.rows[0];

      // Emit the message to the receiver's room if they are online
      const receiverSocketId = connectedUsers[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive-message', newMessage);
      }

      // Emit to sender's room as well
      const senderSocketId = connectedUsers[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit('receive-message', newMessage);
      }

      res.status(201).json(newMessage);
    }
  );
});

// Fetch messages of users from the table to the chat page
app.get('/messages', verifyToken, (req, res) => {
  console.log('User ID:', req.userId); // Log the user ID to verify authentication

  const { receiverId } = req.query;

  if (!receiverId) {
    return res.status(400).json({ message: 'Receiver ID is required' });
  }

  pool.query(
    'SELECT * FROM aman.chat_messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
    [req.userId, receiverId],
    (err, result) => {
      if (err) {
        console.error('Error fetching messages', err);
        return res.status(500).send('Server error');
      }

      res.json(result.rows);
    }
  );
});

// Ensure socket connection is correctly set up
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle joining a user room for private chat
  socket.on('join-room', (userId) => {
    connectedUsers[userId] = socket.id;
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  // Handle sending private messages
  socket.on('send-message', (messageData) => {
    const { receiverId } = messageData;
    const receiverSocketId = connectedUsers[receiverId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive-message', messageData);
    } else {
      console.log(`User ${receiverId} is not connected`);
      // Optionally, you can store the message for later delivery when the user logs in
    }
  });

  // Handle joining a group room for group chat
  socket.on('join-group', (groupId) => {
    const room = `group-${groupId}`;
    socket.join(room);
    console.log(`User joined group room ${room}`);
  });

  // Handle sending group messages
  socket.on('send-group-message', (messageData) => {
    const { groupId } = messageData;
    const room = `group-${groupId}`;
    io.to(room).emit('receive-group-message', messageData);
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

console.log("Server is connected");



// fetch all the users at create group page
app.get('/fullnames', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM aman.chatusers');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching full names', err);
    res.status(500).send('Server error');
  }
});



// Fetch group names on the sidebar
app.get('/groups', verifyToken, async (req, res) => {
  try {
    const userId = req.userId; // Assuming verifyToken middleware sets req.userId

    // Join query to fetch groups where the user is a member
    const query = `
      SELECT sc.*, sc.id as us_id, sg.*
      FROM aman.chatgroups sc
      JOIN aman.groupmembers sg ON sc.id = sg.group_id
      WHERE sg.user_id = $1
    `;

    const result = await pool.query(query, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching groups', err);
    res.status(500).send('Server error');
  }
});


// Send group message
app.post('/send-group-message', verifyToken, (req, res) => {
  const { groupId, message } = req.body;
  const senderId = req.userId;

  if (!groupId || !message) {
    return res.status(400).json({ message: 'Group ID and message are required' });
  }

  pool.query(
    'INSERT INTO aman.groupmessages (group_id, sender_id, message) VALUES ($1, $2, $3) RETURNING *',
    [groupId, senderId, message],
    (err, result) => {
      if (err) {
        console.error('Error storing group message', err);
        return res.status(500).json({ message: 'Server error' });
      }

      const newMessage = result.rows[0];

      // Emit the group message to all group members
      io.to(`group-${groupId}`).emit('receive-group-message', newMessage);

      res.status(201).json(newMessage);
    }
  );
});



// Fetch group messages
app.get('/groups/:groupId/messages', verifyToken, async (req, res) => {
  const { groupId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM aman.groupmessages WHERE group_id = $1', [groupId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching group messages', err);
    res.status(500).send('Server error');
  }
});

// Fetch group details
app.get('/groups/:groupId', verifyToken, async (req, res) => {
  const { groupId } = req.params;
  
  
  try {
    // Fetch group details from the database
    const result = await pool.query(
      'SELECT * FROM aman.chatgroups WHERE id = $1',
      [groupId]
    );
console.log("result"+result);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Group not found');
    }
  } catch (err) {
    console.error('Error fetching group details', err);
    res.status(500).send('Server error');
  }
});





// Create a new group route
app.post('/create-group', async (req, res) => {
  const { groupName } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO aman.chatgroups (group_name) VALUES ($1) RETURNING id',
      [groupName]
    );
    const groupId = result.rows[0].id;
    res.json({ groupId });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).send('Server error');
  }
});

// for  adding group members in to table
app.post('/add-group-members', async (req, res) => {
  const { groupId, userIds } = req.body;
  try {
    // Prepare the query for adding multiple members
    const values = userIds.map(userId => `(${groupId}, ${userId})`).join(',');
    await pool.query(
      `INSERT INTO aman.groupmembers (group_id, user_id) VALUES ${values} ON CONFLICT DO NOTHING`
    );
    res.send('Members added successfully');
  } catch (error) {
    console.error('Error adding group members:', error);
    res.status(500).send('Server error');
  }
});




server.listen(port, '192.168.1.129', function () {
  console.log(`Server is running on http://192.168.1.129:${port}`); });