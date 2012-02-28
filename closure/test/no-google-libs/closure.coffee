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

  ###*
  @return {Object}
  ###
  aMethod: (a = '{?string=}', b='{{id: number, name: string}}', c='yo', d=T('{number=}'), e=T('{number=}', 1) ) =>

  ###*
  Type inference
  ###
  a: (a=T('a')) ->

  b: (b=T(1)) ->

  c: (c=T('{string=}')) ->

  d: (d='yo!') ->
