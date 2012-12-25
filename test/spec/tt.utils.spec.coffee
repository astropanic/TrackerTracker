describe "TT.Utils", ->

  describe "#exists", ->
    subject = TT.Utils.exists

    it "should return true when object is not null and not undefined", ->
      expect(subject('')).toBe true
      expect(subject(0)).toBe true
      expect(subject(1)).toBe true
      expect(subject('abc')).toBe true
      expect(subject({})).toBe true

    it "should return false if object is null or undefined", ->
      expect(subject()).toBe false
      expect(subject(undefined)).toBe false
      expect(subject(null)).toBe false

  describe "#localStorage", ->
    subject = TT.Utils.localStorage
    key = 'myKey'
    val = null

    afterEach ->
      subject(key, null)

    say "an object is passed in", ->
      beforeEach ->
        val = { a: 1, b: 2, c: 3 }

      it "should store the stringified version of that object in localStorage", ->
        expect(subject(key)).toBe undefined
        expect(subject(key, val)).toBe '{"a":1,"b":2,"c":3}'

    say "null is passed in", ->
      beforeEach ->
        val = null

      it "should delete the key", ->
        expect(subject(key)).toBe undefined
        expect(subject(key, 'abc')).toBe 'abc'
        expect(subject(key, null)).toBe undefined
        expect(subject(key)).toBe undefined

  describe "#strToFunction", ->
    subject = TT.Utils.strToFunction

    beforeEach ->
      window.MyLib = {
        myLibFunc: ->
        MyModule: {
          myModuleFunc: ->
        }
      }

    afterEach ->
      delete window.MyLib

    say "a valid function is passed in", ->
      it "should return the function", ->
        expect(subject('MyLib.MyModule.myModuleFunc')).toBe MyLib.MyModule.myModuleFunc

    say "a valid function and context is passed in", ->
      it "should return the function", ->
        expect(subject('MyModule.myModuleFunc', MyLib)).toBe MyLib.MyModule.myModuleFunc

    say "an invalid function is passed in", ->
      it "should return undefined", ->
        expect(subject('Foo.Bar.myFunc')).toBe false

  describe "#generateInitials", ->
    subject = TT.Utils.generateInitials

    it "should return an initialized version of the input string", ->
      expect(subject('User Interface')).toBe 'UI'

  describe "#removeFromArray", ->
    subject = TT.Utils.removeFromArray

    say "an input value strictly matches a value found in the array", ->
      it "should return the array without the value", ->
        expect(subject([1, 2, 3, 4, 5], 4)).toEqual [1, 2, 3, 5]

    say "an input value does not match any value in the array", ->
      it "should return the array without any change", ->
        expect(subject([123, 'abc'], '123')).toEqual [123, 'abc']
