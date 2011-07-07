class example.people.Adult extends example.people.Person

  constructor: (first, last) ->
    super(first, last)

  toString: ->
    "I am an adult named " + super()
