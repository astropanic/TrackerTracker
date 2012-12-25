describe "TT.Utils", ->

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
