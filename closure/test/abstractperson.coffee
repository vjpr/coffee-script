# This class is used to test out the "synthetic constructor" logic in CoffeeScript.

include 'goog.array'

class example.people.AbstractPerson

  getFriends_: ->
    @friends or (@friends = [])

  addFriend: (friend) ->
    @getFriends_().push(friend)

  hasFriend: (friend) ->
    goog.array.contains @getFriends_(), friend
    
  @isMutalFriends: (friendA, friendB) ->
    friendA.hasFriend(friendB) and friendB.hasFriend(friendA)
