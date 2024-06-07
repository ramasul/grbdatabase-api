# grbdatabase-api
API for Good Reading Bookstore Database (GRB) by Rama Sulaiman N (Gadjah Mada University) 

## Tools Used
- Node.js
- npm
- PostgreSQL for the grb_database
- Postman to send HTTP request (and curl in cmd)

## Running the Server
1. Extract the .rar
2. Open Command Prompt in the directory of the API folder
3. Do the command "node index.js" and the server will run

## How to Use
Currently, there're only 12 total HTTP request / CRUD in the API 

### GET 
- http://localhost:3000/books = To see the list of all books
- http://localhost:3000/books/:id = To select a book based on the id
- http://localhost:3000/books/keyword/:keyword = To search books based on the keyword
- http://localhost:3000/books/authors/:name = To search books created by particular author
- http://localhost:3000/books/price/:lower/:upper = To find books based on the price range
- http://localhost:3000/authors/:id = To find an author based on the id
- http://localhost:3000/users/:id/wishlist = To see the list of user's wishlist by the user id

### PUT
- http://localhost:3000/authors/:id
Input in JSON raw :
{
  "name" : "<update to this name>",
  "year_born"  : <update the author year born to this year>,
  "year_died"  : <update the author year died to this year>
}

Note : All of input above is not mandatory, 
For example 
{
  "name" : "Tere Liye",
  "year_born"  : 1979
}

Will still works



### DELETE
- http://localhost:3000/users/:id/wishlist
Input in JSON raw :
{
  "book_id" : <delete the book with id "book_id" from wishlist of this user>
} 


### POST
- http://localhost:3000/users/:id/wishlist
Input in JSON raw : 
{
  "book_id" : <add the book with id "book_id" to wishlist of this user>
} 

- http://localhost:3000/books
Input in JSON raw :
{
  "publisher_name" : "<insert the publisher name>",
  "language" : "<insert the book language>",
  "author_name" : "<insert the author name>",
  "book_title" : "<insert the book title>",
  "publication_year" : <insert the publication_year>,
  "isbn" : "<insert the isbn of the book>",
  "pages" : <insert how much pages does the book have>,
  "price" : <insert the price in XXXXX.XX>
}
Caution : All of the input is MANDATORY 
  
 
- http://localhost:3000/ratings/:id
Input in JSON raw :
{
  "book_id" : <insert the book id that the user rate>,
  "rating" : <insert the rating in range 1 and 5>
}



## SQL 
- All HTTP request is executing a SQL query
- The command PUT author and POST rating used UPDATE query
- All the PUT, DELETE, and POST request is implemented using TCL to prevent unwanted error   
