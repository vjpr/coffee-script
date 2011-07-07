class Adult extends Person

  constructor: (first, last) ->
    super(first, last)

  /** @inheritDoc */
  toString: ->
    "I am an adult named " + super()
