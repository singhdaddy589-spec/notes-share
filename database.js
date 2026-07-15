const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    users: [],
    notes: [],
    comments: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
}

// Helper to read database
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file, returning empty schema:', err);
    return { users: [], notes: [], comments: [] };
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Generate simple unique IDs
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

const Database = {
  // --- USERS ---
  createUser(username, email, hashedPassword) {
    const db = readDB();
    
    // Check if user already exists
    const exists = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
    if (exists) return null;

    const newUser = {
      id: generateId(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    // Don't return the password hash
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  getUserByUsername(username) {
    const db = readDB();
    return db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  getUserById(id) {
    const db = readDB();
    const user = db.users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  // --- NOTES ---
  createNote({ userId, author, title, description, subject, tags, fileType, filePath, fileName, content }) {
    const db = readDB();
    const newNote = {
      id: generateId(),
      userId,
      author,
      title,
      description,
      subject,
      tags: tags || [],
      fileType, // 'text' or 'file'
      filePath: filePath || null,
      fileName: fileName || null,
      content: content || '',
      likes: [], // list of userIds who liked it
      views: 0,
      createdAt: new Date().toISOString()
    };

    db.notes.push(newNote);
    writeDB(db);
    return newNote;
  },

  getAllNotes() {
    const db = readDB();
    // Return notes sorted by newest first
    return [...db.notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getNoteById(id) {
    const db = readDB();
    const note = db.notes.find(n => n.id === id);
    if (note) {
      // Increment views
      note.views = (note.views || 0) + 1;
      writeDB(db);
    }
    return note;
  },

  deleteNote(id, userId) {
    const db = readDB();
    const index = db.notes.findIndex(n => n.id === id && n.userId === userId);
    if (index === -1) return false;

    // Delete associated uploaded file if exists
    const note = db.notes[index];
    if (note.fileType === 'file' && note.filePath) {
      try {
        const fullPath = path.join(__dirname, note.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    db.notes.splice(index, 1);
    
    // Also delete associated comments
    db.comments = db.comments.filter(c => c.noteId !== id);
    
    writeDB(db);
    return true;
  },

  toggleLikeNote(noteId, userId) {
    const db = readDB();
    const note = db.notes.find(n => n.id === noteId);
    if (!note) return null;

    if (!note.likes) note.likes = [];

    const userIndex = note.likes.indexOf(userId);
    let liked = false;
    if (userIndex === -1) {
      note.likes.push(userId);
      liked = true;
    } else {
      note.likes.splice(userIndex, 1);
      liked = false;
    }

    writeDB(db);
    return { likesCount: note.likes.length, liked };
  },

  // --- COMMENTS ---
  createComment(noteId, userId, author, content) {
    const db = readDB();
    
    // Verify note exists
    const note = db.notes.find(n => n.id === noteId);
    if (!note) return null;

    const newComment = {
      id: generateId(),
      noteId,
      userId,
      author,
      content,
      createdAt: new Date().toISOString()
    };

    db.comments.push(newComment);
    writeDB(db);
    return newComment;
  },

  getCommentsByNoteId(noteId) {
    const db = readDB();
    return db.comments
      .filter(c => c.noteId === noteId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Oldest first
  }
};

module.exports = Database;
