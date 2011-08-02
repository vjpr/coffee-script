# TODO: Make it possible to specify type information.
# TODO: Make sure that it is possible to specify quoted vs. unquoted
#       properties so the code can be compiled in Advanced mode.
# TODO: Make sure that everything in nodes.UTILITIES uses a Closure Library
#       equivalent when --google is used.
# TODO: Support enums.

class example.people.Person extends example.people.AbstractPerson

  constructor: (@first, @last) ->
    super()

  getFirst: -> @first

  setFirst: (first) -> @first = first

  getLast: -> @last

  setLast: (last) -> @last = last

  toString: ->
    "#{@first} #{@last}"
