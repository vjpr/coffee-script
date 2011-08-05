# TODO: Support enums.

include goog.dom

class example.people.Person extends example.people.AbstractPerson

  constructor: (@first, @last) ->
    super()

  getFirst: -> @first

  setFirst: (first) -> @first = first

  getLast: -> @last

  setLast: (last) -> @last = last

  toString: ->
    "#{@first} #{@last}"
