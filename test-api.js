const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Set up clean database for testing
const DB_FILE = path.join(__dirname, 'db.json');
if (fs.existsSync(DB_FILE)) {
  fs.unlinkSync(DB_FILE); // Start fresh
}

// Require database (which will now correctly initialize the file)
const DB = require('./database');

async function runTests() {
  console.log('🧪 Starting backend unit tests...\n');

  try {
    // 1. Test User Creation
    console.log('⌛ Testing User Creation...');
    const user1 = DB.createUser('alice', 'alice@school.edu', 'hashed_pass_123');
    assert(user1 !== null, 'User creation should succeed');
    assert(user1.username === 'alice', 'Username matches');
    assert(user1.email === 'alice@school.edu', 'Email matches');
    assert(user1.password === undefined, 'Should not return password');
    console.log('✅ User Creation verified.\n');

    // 2. Test Duplicate User Prevention
    console.log('⌛ Testing Duplicate User Prevention...');
    const duplicate = DB.createUser('alice', 'different@email.com', 'pass');
    assert(duplicate === null, 'Should fail with duplicate username');
    console.log('✅ Duplicate User Prevention verified.\n');

    // 3. Test Note Creation
    console.log('⌛ Testing Note Creation...');
    const note1 = DB.createNote({
      userId: user1.id,
      author: user1.username,
      title: 'Linear Algebra Cheat Sheet',
      description: 'Quick summary for midterm exam',
      subject: 'Mathematics',
      tags: ['exam-prep', 'midterm', 'vectors'],
      fileType: 'text',
      content: '# Linear Algebra\nVector spaces are sets of vectors...'
    });
    assert(note1 !== null, 'Note creation should succeed');
    assert(note1.title === 'Linear Algebra Cheat Sheet', 'Title matches');
    assert(note1.subject === 'Mathematics', 'Subject matches');
    assert(note1.tags.includes('vectors'), 'Tags are present');
    console.log('✅ Note Creation verified.\n');

    // 4. Test Note Fetching
    console.log('⌛ Testing Note Fetching & Views...');
    const allNotes = DB.getAllNotes();
    assert(allNotes.length === 1, 'Should find 1 note');
    
    // Test view increment
    const noteDetail = DB.getNoteById(note1.id);
    assert(noteDetail.views === 1, 'Views should be 1 after fetching details');
    console.log('✅ Note Fetching verified.\n');

    // 5. Test Like Toggle
    console.log('⌛ Testing Likes...');
    const likeResult = DB.toggleLikeNote(note1.id, 'another_user_id');
    assert(likeResult.liked === true, 'First toggle should like the note');
    assert(likeResult.likesCount === 1, 'Likes count should be 1');

    const unlikeResult = DB.toggleLikeNote(note1.id, 'another_user_id');
    assert(unlikeResult.liked === false, 'Second toggle should unlike the note');
    assert(unlikeResult.likesCount === 0, 'Likes count should go back to 0');
    console.log('✅ Note Likes verified.\n');

    // 6. Test Comments
    console.log('⌛ Testing Comments...');
    const comment1 = DB.createComment(note1.id, user1.id, user1.username, 'Awesome summary, thanks!');
    assert(comment1 !== null, 'Comment should be created');
    
    const commentsList = DB.getCommentsByNoteId(note1.id);
    assert(commentsList.length === 1, 'Should find 1 comment');
    assert(commentsList[0].content === 'Awesome summary, thanks!', 'Comment text matches');
    console.log('✅ Comments verified.\n');

    console.log('🎉 All backend tests completed successfully!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
