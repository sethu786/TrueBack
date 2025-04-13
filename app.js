const express = require('express')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')
const cors = require('cors')

const app = express()
app.use(express.json())
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.use(cors())
const dbPath = path.join(__dirname, 'candidates.db')
let db

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    await db.exec(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')) NOT NULL,
        experience TEXT NOT NULL,
        skills TEXT NOT NULL
      );
    `)
    console.log('Connected to SQLite database')
  } catch (error) {
    console.error('Error connecting to SQLite:', error)
    process.exit(1)
  }
}

initializeDB()

// POST: Add a new candidate
app.post('/candidates', async (req, res) => {
  try {
    const { name, phone, email, gender, experience, skills } = req.body
    if (!name || !phone || !email || !gender || !experience || !skills) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    await db.run(
      `INSERT INTO candidates (name, phone, email, gender, experience, skills) VALUES (?, ?, ?, ?, ?, ?);`,
      [name, phone, email, gender, experience, skills],
    )
    res.status(201).json({ message: 'Candidate added successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// GET: Retrieve all candidates
app.get('/candidatesGet', async (req, res) => {
  try {
    const candidates = await db.all('SELECT * FROM candidates')
    res.json(candidates)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// DELETE: Remove a candidate by ID
app.delete('/candidatesDel/:id', async (req, res) => {
  const { id } = req.params
  console.log(`Attempting to delete candidate with ID: ${id}`); // Log the ID
  try {
    const result = await db.run(`DELETE FROM candidates WHERE id = 1`, [id])
    
    if (result.changes === 0) {
      console.log('No candidate found with that ID'); // Log if no candidate was found
      return res.status(404).json({ error: 'Candidate not found' })
    }
    
    res.status(200).json({ message: 'Candidate deleted successfully' })
  } catch (error) {
    console.error('Error deleting candidate:', error); // Log the error
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
