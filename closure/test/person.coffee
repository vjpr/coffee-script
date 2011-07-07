class Person

  constructor: (@first, @last) ->
  
  /** @return {string} */  
  getFirst: ->
    @first

  /** @return {string} */  
  getLast: ->
    @last

  /** @inheritDoc */
  toString: ->
    "#{@first} #{@last}"
