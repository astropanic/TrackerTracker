describe "Models", ->

  describe "Shared methods", ->
    Color = TT.Model.Model('Color')

    beforeEach ->
      Color.flush()

    say "we try to get a non-existing object", ->
      it "should return undefined", ->
        expect(Color.get({ id: 999 })).toBe undefined

    say "we try to get the index of a non-existing object", ->
      it "should return undefined", ->
        expect(Color.index({ id: 999 })).toBe undefined

    say "we add some objects", ->
      beforeEach ->
        Color.add({ id: 1, name: 'blue', hex: '0000ff' })
        Color.add({ id: 2, name: 'red', hex: 'ff0000' })
        Color.add({ id: 3, name: 'green', hex: '00ff00' })

      it "should have stored those objects in the DB array", ->
        expect(Color.get().length).toBe 3

      it "should make those objects searchable by property", ->
        expect(Color.get({ id: 2 }).name).toBe 'red'

      also "we try to remove an existing object", ->
        beforeEach ->
          Color.remove({ name: 'green' })

        it "should no longer find that object", ->
          expect(Color.get({ name: 'green' })).toBe undefined

        it "should decrease the DB array length by 1", ->
          expect(Color.get().length).toBe 2

      also "we try to remove an object that doesn't exist", ->
        beforeEach ->
          Color.remove({ name: 'yellow' })

        it "should do nothing", ->
          expect(Color.get().length).toBe 3

      also "we try to rearrange the order of existing objects", ->
        beforeEach ->
          Color.move(1, 2)

        it "should be able to rearrange the order of existing objects", ->
          expect(Color.index({ id: 2 })).toBe 2
          expect(Color.index({ id: 3 })).toBe 1

      also "we try to overwrite an existing object", ->
        beforeEach ->
          Color.overwrite({ id: 1, name: 'black', hex: '000000' })
          Color.overwrite({ id: 3, name: 'orange', hex: 'ff9900' })

        it "should overwrite the object", ->
          expect(Color.get({ id: 1 }).name).toBe 'black'
          expect(Color.get({ id: 3 }).name).toBe 'orange'

      also "we try to overwrite a non-existing object", ->
        beforeEach ->
          Color.overwrite({ id: 4, name: 'black', hex: '000000' })

        it "should add the object to the end of the array", ->
          expect(Color.get().length).toBe 4
          expect(Color.get()[3].name).toBe 'black'

      also "we try to update an existing object", ->
        beforeEach ->
          Color.update({ id: 3 }, { hex: '00cc00' })

        it "should update the object", ->
          expect(Color.get().length).toBe 3
          expect(Color.get({ name: 'green' })).toEqual { id: 3, name: 'green', hex: '00cc00' }

      also "we try to update a non-existing object", ->
        beforeEach ->
          Color.update({ id: 4 }, { hex: '999999' })

        it "should do nothing", ->
          expect(Color.get({ id: 4 })).toBe undefined
          expect(Color.get().length).toBe 3
