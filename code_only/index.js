const express = require('express')
const bodyParser = require('body-parser')
var cors = require('cors')
const app = express()
const db = require('./queries')
const port = 3000

app.use(cors())
app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/books', db.getBooks)
app.get('/books/:id', db.getBookById)
app.get('/books/keyword/:keyword', db.getBooksByKeyword)
app.get('/books/authors/:name', db.getBooksByAuthor)
app.get('/books/price/:lower/:upper', db.getBooksByPriceRange)
app.get('/authors/:id', db.getAuthorById)
app.get('/users/:id/wishlist', db.getWishlistByUserId)

app.put('/authors/:id', async (req, res) => {
    try {
        const result = await db.updateAuthor(req, res);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/users/:id/wishlist', async (req, res) => {
    try {
        const result = await db.deleteWishlist(req, res);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/users/:id/wishlist', async (req, res) => {
    try {
        const result = await db.postWishlist(req, res);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.post('/books', async (req, res) => {
    try {
        const result = await db.postAddBook(req, res);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/ratings/:id', async (req, res) => {
    try {
        const result = await db.postRatingByUserId(req, res);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Server start
app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})