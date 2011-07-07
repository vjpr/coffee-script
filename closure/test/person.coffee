class example.people.Person extends example.people.AbstractPerson

  constructor: (@first, @last) ->
    super()
  
  # TODO: For non-accessor methods (such as setFirst(), figure out how to
  # eliminate the return statement.
  # It may get removed by the Closure Compiler, but it's just awkward having it
  # there.
  
  # TODO: Handling of JSDoc comments is weird.
  
  # TODO: How will goog.require() statements be accounted for? Included manually?

  /** @return {string} */
  getFirst: -> @first

  /** @param {string} first */
  setFirst: (first) -> @first = first

  /** @return {string} */  
  getLast: -> @last

  /** @param {string} last */
  setLast: (last) -> @last = last

  /** @inheritDoc */
  toString: ->
    "#{@first} #{@last}"
