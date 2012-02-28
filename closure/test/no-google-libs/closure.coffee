class example.test

  ###* @param {string} bar ###
  constructor: (foo, @bar = 'test') ->
  	foo = 'foo'

 class test2

  ###*
  @param {string} bar
  ###
  constructor: ->

  ###* hello ###
  getBar: => @bar

  ###*
  hello 
  ###
  getFoo: => @foo

  ###*
  hello
  ###

  getFoo2: => @foo