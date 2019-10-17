class QueryBuilder {
    constructor(query, queryString) {
      this.queryString = queryString
      this.query = query
    }
  
    filter() {
      /* Removing restricted keys which are not actually query conditions */
      let queryObject = {...this.queryString}
      const excludedFields = ['page', 'sort', 'limit', 'fields']
      excludedFields.forEach((currentField) => {
        delete queryObject[currentField]
      })
  
      /* This steps are to add $ before any condition matcher like gte, etc. 
      the query String is like ?duration[gte]=5&difficulty=easy */
      let queryStr = JSON.stringify(queryObject)
      queryStr = queryStr.replace(/\b(gte|lte|lt|gt)\b/g, match => `$${match}`)
      queryObject = JSON.parse(queryStr)
      
      /* If we directly await here then we can't chain further methods, build query here     */
      this.query = this.query.find(queryObject)
      
      //this is being returned so that methods can be chained
      return this
    }
  
    sort() {
      /* Sorting, sort=price -> sorts by the price field (default ascending), sort=-price(descending)
      split multiple sort fields -> .sort({price ratingsAverage}) [the actual mongoose function] */
      if(this.queryString.sort) {    
        const sortBy = this.queryString.sort.split(',').join(' ')
        this.query = this.query.sort(sortBy)
      } else {
        //default sort can be added
        this.query = this.query.sort('-createdAt')
      }
  
      return this
    }
  
    select() {
      /* projection */
      if(this.queryString.fields) {
        const fields = this.queryString.fields.split(',').join(' ')
        this.query = this.query.select(fields)
      } else {
        //Default, remove mongoose field
        this.query.select('-__v')
      }
  
      return this
    }
  
    paginate() {
      /* pagination,?page=2&limit=10, get me page 2 and 10 results, that means skip first page. */
      const page = parseInt(this.queryString.page) || 1
      const limit = parseInt(this.queryString.limit) || 100
      this.query = this.query.skip((page - 1)*limit).limit(limit)
  
      return this
    }
    
   }

   module.exports = QueryBuilder