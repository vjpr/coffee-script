
class test3
  
  ###*
  @param {string} bar
  ###
  constructor: (foo='test') ->

  get: =>


class test

  ###*
  @param {string} bar
  ###
  constructor: (foo, @bar = 'test') ->
  	foo = 'foo'

class test2

  ###*
  @param {string} bar
  ###
  constructor: (foo='test') ->
  	test

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
  @param {?string=} a
  @return {Object}
  ###
  aMethod: (a = '{?string=}', b='{{id: number, name: string}}', c='yo', d=T('{number=}'), e=T('{number=}', 1) ) =>

  ###*
  Type inference
  ###
  a: (a=T('a')) ->

  b: (b=T(1)) ->

  c: (c=T('{?string=}')) ->

  cc: (c='{?string=}') ->

  d: (d='yo!') ->

class toast

  ###*
  @param {string} bar
  ###
  constructor: (foo='test') ->