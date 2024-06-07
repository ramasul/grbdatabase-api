const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'grb_database',
    password: '519483762',
    port: 5432,
})

const getBooks = (request, response) => {
    query = 'SELECT * FROM book_details_view ORDER BY title ASC'
    pool.query(query, (error, results) => {
        if (error) {
            console.error('Error executing query:', error)
            response.status(500).json({ error: 'Internal server error' })
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getBookById = (request, response) => {
    const id = parseInt(request.params.id)
    const query = 'SELECT * FROM book_details_view WHERE book_id = $1'
    pool.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error executing query:', error)
            response.status(500).json({ error: 'Internal server error' })
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getBooksByAuthor = (request, response) => {
    const name = request.params.name
    const query = 'SELECT * FROM book_details_view WHERE author ILIKE $1'
    const searchTerm = `%${name}%`

    pool.query(query, [searchTerm], (error, results) => {
        if (error) {
            console.error('Error executing query:', error)
            response.status(500).json({ error: 'Internal server error' })
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getBooksByKeyword= (request, response) => {
    const keyword = request.params.keyword
    const query = 'SELECT * FROM book_details_view WHERE title ILIKE $1 OR language ILIKE $1 OR author ILIKE $1 OR publisher ILIKE $1 OR genre ILIKE $1 OR CAST(publication_year AS VARCHAR) ILIKE $1 OR CAST(isbn AS VARCHAR) ILIKE $1'
    const searchTerm = `%${keyword}%`

    pool.query(query, [searchTerm], (error, results) => {
        if (error) {
            console.error('Error executing query:', error)
            response.status(500).json({ error: 'Internal server error' })
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getBooksByPriceRange = (request, response) => {
    const lowerbound = parseFloat(request.params.lower)
    const upperbound = parseFloat(request.params.upper)
    const query = 'SELECT * FROM book_details_view WHERE price >= $1 AND price <= $2'

    pool.query(query, [lowerbound, upperbound], (error, results) => {
        if (error) {
            console.error('Error executing query:', error)
            response.status(500).json({ error: 'Internal server error' })
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getAuthorById = (request, response) => {
    const id = parseInt(request.params.id)
    const query = 'SELECT * FROM author WHERE author_id = $1'
    pool.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error executing query:', error)
            response.status(500).json({ error: 'Internal server error' })
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getWishlistByUserId = (request, response) => {
    const id = parseInt(request.params.id)
    const query = `
    SELECT bdv.* 
    FROM wishlist w 
    JOIN book_details_view bdv ON w.book_id = bdv.book_id 
    WHERE w.user_id = $1`
    pool.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error executing query:', error)
            response.status(500).json({ error: 'Internal server error' })
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const updateAuthor = async (request, response) => {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')
        const id = parseInt(request.params.id)
        const { name, year_born, year_died } = request.body

        let query = 'UPDATE author SET'
        const values = []
        if (name !== undefined) {
            query += ' name = $1'
            values.push(name)
        }
        if (year_born !== undefined) {
            if (values.length > 0) query += ','
            query += ' year_born = $' + (values.length + 1)
            values.push(year_born)
        }
        if (year_died !== undefined) {
            if (values.length > 0) query += ','
            query += ' year_died = $' + (values.length + 1)
            values.push(year_died)
        }
        query += ', last_update = CURRENT_TIMESTAMP::TIMESTAMP(0) WHERE author_id = $' + (values.length + 1)
        values.push(id)

        await client.query(query, values)
        await client.query('COMMIT')

        return { message: 'Columns updated successfully' }
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Error executing transaction:', error.message)
        throw error
    } finally {
        client.release()
    }
}

const deleteWishlist = async (request, response) => {
    const client = await pool.connect()

    try {
        await client.query('BEGIN')
        const { book_id } = request.body
        const user_id = parseInt(request.params.id)

        const checkBookQuery = 'SELECT 1 FROM book WHERE book_id = $1'
        const bookResult = await client.query(checkBookQuery, [book_id])
        if (bookResult.rows.length === 0) {
            throw new Error('Book does not exist')
        }

        const checkUserQuery = 'SELECT 1 FROM "user" WHERE user_id = $1'
        const userResult = await client.query(checkUserQuery, [user_id])
        if (userResult.rows.length === 0) {
            throw new Error('User does not exist')
        }

        const checkWishlistQuery = `
            SELECT 1 FROM wishlist 
            WHERE book_id = $1 AND user_id = $2
        `
        const wishlistResult = await client.query(checkWishlistQuery, [book_id, user_id])
        if (wishlistResult.rows.length > 0) {
            const insertWishlistQuery = `
            DELETE FROM wishlist 
            WHERE user_id = $2
            AND book_id = $1
        `
            await client.query(insertWishlistQuery, [book_id, user_id])
        }
        else {
            return { message: 'Book is not in the wishlist in the first place' }
        }
        await client.query('COMMIT')

        return { message: 'Book removed from wishlist successfully' }
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Error executing transaction:', error.message)
        throw error
    } finally {
        client.release()
    }
}

const postWishlist = async (request, response) => {
    const client = await pool.connect()
    
    try {
        await client.query('BEGIN')
        const { book_id } = request.body
        const user_id = parseInt(request.params.id)

        const checkBookQuery = 'SELECT 1 FROM book WHERE book_id = $1'
        const bookResult = await client.query(checkBookQuery, [book_id])
        if (bookResult.rows.length === 0) {
            throw new Error('Book does not exist')
        }

        const checkUserQuery = 'SELECT 1 FROM "user" WHERE user_id = $1'
        const userResult = await client.query(checkUserQuery, [user_id])
        if (userResult.rows.length === 0) {
            throw new Error('User does not exist')
        }

        const checkWishlistQuery = `
            SELECT 1 FROM wishlist 
            WHERE book_id = $1 AND user_id = $2
        `
        const wishlistResult = await client.query(checkWishlistQuery, [book_id, user_id])
        if (wishlistResult.rows.length > 0) {
            return { message: 'Book is already in the wishlist' }
        }

        const insertWishlistQuery = `
            INSERT INTO wishlist (book_id, user_id, last_update) 
            VALUES ($1, $2, CURRENT_TIMESTAMP::TIMESTAMP(0))
        `
        await client.query(insertWishlistQuery, [book_id, user_id])

        await client.query('COMMIT')

        return { message: 'Book added to wishlist successfully' }
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Error executing transaction:', error.message)
        throw error
    } finally {
        client.release()
    }
}

const postRatingByUserId = async (request, response) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const user_id = parseInt(request.params.id)
        const { book_id, rating } = request.body

        if (rating < 1 || rating > 5) {
            return response.status(400).json({ error: 'Rating must be between 1 and 5' })
        }

        const checkUserQuery = 'SELECT * FROM "user" WHERE user_id = $1'
        const userResult = await client.query(checkUserQuery, [user_id])
        if (userResult.rows.length === 0) {
            throw new Error('User does not exist')
        }

        
        const checkBookQuery = 'SELECT * FROM "book" WHERE book_id = $1'
        const bookResult = await client.query(checkBookQuery, [book_id])
        if (bookResult.rows.length === 0) {
            throw new Error('Book does not exist')
        }

        
        const insertOrUpdateQuery = `
            INSERT INTO online_rating (user_id, book_id, rating, last_update)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP::TIMESTAMP(0))
            ON CONFLICT (user_id, book_id) DO UPDATE
            SET rating = EXCLUDED.rating, last_update = EXCLUDED.last_update
        `
        const insertOrUpdateValues = [user_id, book_id, rating]
        await client.query(insertOrUpdateQuery, insertOrUpdateValues)

        await client.query('COMMIT')

        return { message: 'Rating updated successfully' }
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Error executing query:', error)
        response.status(500).json({ error: 'Internal server error' })
        throw error
    } finally {
        client.release()
    }
}

const postAddBook = async (request, response) => {
    const client = await pool.connect()

    try {
        await client.query('BEGIN') 
        const {
            publisher_name,
            language,
            author_name,
            book_title,
            publication_year,
            isbn,
            pages,
            price
        } = request.body
        const getMaxBookIdQuery = 'SELECT MAX(book_id) AS max_book_id FROM book'
        const maxBookIdResult = await client.query(getMaxBookIdQuery)
        const newbook_id = (maxBookIdResult.rows[0].max_book_id || 0) + 1

        let newbook_author_id
        const checkAuthorQuery = 'SELECT author_id FROM author WHERE name = $1'
        const authorResult = await client.query(checkAuthorQuery, [author_name])
        if (authorResult.rows.length > 0) {
            newbook_author_id = authorResult.rows[0].author_id
        } else {
            const getMaxAuthorIdQuery = 'SELECT MAX(author_id) AS max_author_id FROM author'
            const maxAuthorIdResult = await client.query(getMaxAuthorIdQuery)
            newbook_author_id = (maxAuthorIdResult.rows[0].max_author_id || 0) + 1
            const insertAuthorQuery = 'INSERT INTO author (author_id, name, last_update) VALUES ($1, $2, CURRENT_TIMESTAMP::TIMESTAMP(0))'
            await client.query(insertAuthorQuery, [newbook_author_id, author_name])
        }

        let newbook_publisher_id
        const checkPublisherQuery = 'SELECT publisher_id FROM publisher WHERE name = $1'
        const publisherResult = await client.query(checkPublisherQuery, [publisher_name])
        if (publisherResult.rows.length > 0) {
            newbook_publisher_id = publisherResult.rows[0].publisher_id
        } else {
            const getMaxPublisherIdQuery = 'SELECT MAX(publisher_id) AS max_publisher_id FROM publisher'
            const maxPublisherIdResult = await client.query(getMaxPublisherIdQuery)
            newbook_publisher_id = (maxPublisherIdResult.rows[0].max_publisher_id || 0) + 1
            const insertPublisherQuery = 'INSERT INTO publisher (publisher_id, name, last_update) VALUES ($1, $2, CURRENT_TIMESTAMP::TIMESTAMP(0))'
            await client.query(insertPublisherQuery, [newbook_publisher_id, publisher_name])
        }

        let newbook_language_id
        const checkLanguageQuery = 'SELECT language_id FROM language WHERE name = $1'
        const languageResult = await client.query(checkLanguageQuery, [language])
        if (languageResult.rows.length > 0) {
            newbook_language_id = languageResult.rows[0].language_id
        } else {
            const getMaxLanguageIdQuery = 'SELECT MAX(language_id) AS max_language_id FROM language'
            const maxLanguageIdResult = await client.query(getMaxLanguageIdQuery)
            newbook_language_id = (maxLanguageIdResult.rows[0].max_language_id || 0) + 1
            const insertLanguageQuery = 'INSERT INTO language (language_id, name, last_update) VALUES ($1, $2, CURRENT_TIMESTAMP::TIMESTAMP(0))'
            await client.query(insertLanguageQuery, [newbook_language_id, language])
        }

        const insertBookQuery = `
            INSERT INTO book (book_id, publisher_id, language_id, title, publication_year, isbn, pages, price, last_update)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP::TIMESTAMP(0))
        `
        const insertBookValues = [
            newbook_id,
            newbook_publisher_id,
            newbook_language_id,
            book_title,
            publication_year,
            isbn,
            pages,
            price
        ]
        await client.query(insertBookQuery, insertBookValues)

        const insertAuthorBookQuery = 'INSERT INTO book_author (author_id, book_id, last_update) VALUES ($1, $2, CURRENT_TIMESTAMP::TIMESTAMP(0))'
        const insertAuthorBookValues = [newbook_author_id, newbook_id]
        await client.query(insertAuthorBookQuery, insertAuthorBookValues)

        await client.query('COMMIT') 

        return { message: 'Book added successfully' }
    } catch (error) {
        await client.query('ROLLBACK') 
        console.error('Error executing transaction:', error.message)
        esponse.status(500).json({ error: 'Internal server error' })
        throw error
    } finally {
        client.release() 
    }
}


module.exports = {
    getBooks,
    getBookById,
    getBooksByAuthor,
    getBooksByKeyword,
    getBooksByPriceRange,
    getAuthorById,
    getWishlistByUserId,
    updateAuthor,
    deleteWishlist,
    postWishlist,
    postAddBook,
    postRatingByUserId,
}