
# An exhaustive sample Express Mongo app 

## Use-Case:

A set of api endpoints (documentation available [here](https://documenter.getpostman.com/view/270577/SVtZuktV?version=latest)) for a tour & travel agency. The main components of it
are:

-   **Users** – People who would access the system:

    -   _Admin_

    -   _Lead-Guide_: The lead guide for a tour

    -   _Guide_: The other guides assigned to a tour

    -   _Customer_: The end users who would purchase the tour

-   **Tours** – The actual tour details

-   **Reviews** – The reviews posted by customers for a particular tour

-   Bookings – TBD

## Technologies/Libraries used:

-   Nodemon

-   Express

-   Express third-party middlewares [morgan, rateLimit, helmet, mongo-sanitize,
    xss, hpp] and custom middlewares

-   Mongoose

-   Bcrypt & Jwt

-   Dotenv

-   Nodemailer

## Features & Considerations:

-   CRUD operations

-   Authentication using JWT

-   Password Encryption

-   Forgot Password Feature with reset token being sent to mail.

-   Global Error Handling

-   Custom behavior as per the execution environment, i.e, production or
    development.

-   Mongo DB hosted on Atlas

-   Aggregating, Sorting, Filtering, Pagination, Selection, Aliasing using
    Mongoose

-   Use of virtuals to project fields in outputs.

-   In-built and custom validation

-   Adaquate use of pre and post mongoose hooks for certain database operations

-   Modeling of Relational data in Mongoose with child & parent referencing

-   GeoSpatial Queries & Aggregation
