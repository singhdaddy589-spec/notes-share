const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'noteshare_super_secret_key_12345';

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and append unique timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// --- AUTHENTICATION ENDPOINTS ---

// User Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: 'Username must be at least 3 characters and password at least 6 characters' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = Database.createUser(username, email, hashedPassword);
    if (!newUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Create JWT token
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = Database.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = Database.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// --- NOTES ENDPOINTS ---

// Get All Notes (with Search and Filters)
app.get('/api/notes', (req, res) => {
  try {
    let notes = Database.getAllNotes();
    const { search, subject, tag, userId, likedBy } = req.query;

    if (search) {
      const query = search.toLowerCase();
      notes = notes.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.description.toLowerCase().includes(query) ||
        n.author.toLowerCase().includes(query) ||
        n.subject.toLowerCase().includes(query) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(query)))
      );
    }

    if (subject) {
      notes = notes.filter(n => n.subject.toLowerCase() === subject.toLowerCase());
    }

    if (tag) {
      notes = notes.filter(n => n.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
    }

    if (userId) {
      notes = notes.filter(n => n.userId === userId);
    }

    if (likedBy) {
      notes = notes.filter(n => n.likes && n.likes.includes(likedBy));
    }

    res.json({ notes });
  } catch (err) {
    console.error('Fetch notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get Single Note
app.get('/api/notes/:id', (req, res) => {
  try {
    const note = Database.getNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ note });
  } catch (err) {
    console.error('Fetch single note error:', err);
    res.status(500).json({ error: 'Failed to fetch note detail' });
  }
});

// Create a Note
app.post('/api/notes', authenticateToken, upload.single('file'), (req, res) => {
  try {
    const { title, description, subject, tags, fileType, content } = req.body;
    
    if (!title || !subject) {
      return res.status(400).json({ error: 'Title and subject are required' });
    }

    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    let noteData = {
      userId: req.user.id,
      author: req.user.username,
      title,
      description,
      subject,
      tags: parsedTags,
      fileType // 'text' or 'file'
    };

    if (fileType === 'file') {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required for file type notes' });
      }
      noteData.filePath = `uploads/${req.file.filename}`;
      noteData.fileName = req.file.originalname;
    } else {
      if (!content) {
        return res.status(400).json({ error: 'Content is required for text notes' });
      }
      noteData.content = content;
    }

    const note = Database.createNote(noteData);
    res.status(201).json({ message: 'Note created successfully', note });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Delete a Note
app.delete('/api/notes/:id', authenticateToken, (req, res) => {
  try {
    const noteId = req.params.id;
    const deleted = Database.deleteNote(noteId, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Toggle Like on a Note
app.post('/api/notes/:id/like', authenticateToken, (req, res) => {
  try {
    const result = Database.toggleLikeNote(req.params.id, req.user.id);
    if (!result) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(result);
  } catch (err) {
    console.error('Like note error:', err);
    res.status(500).json({ error: 'Failed to update like status' });
  }
});

// --- COMMENTS ENDPOINTS ---

// Get Comments for a Note
app.get('/api/notes/:id/comments', (req, res) => {
  try {
    const comments = Database.getCommentsByNoteId(req.params.id);
    res.json({ comments });
  } catch (err) {
    console.error('Fetch comments error:', err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// Add a Comment to a Note
app.post('/api/notes/:id/comments', authenticateToken, (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const comment = Database.createComment(req.params.id, req.user.id, req.user.username, content);
    if (!comment) {
      return res.status(404).json({ error: 'Note not found to comment on' });
    }
    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Fallback to serving public/index.html for any other requests (SPA Routing support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`NoteShare backend running on http://localhost:${PORT}`);
});
