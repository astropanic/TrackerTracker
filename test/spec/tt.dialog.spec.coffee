describe "Dialog", ->

  describe "UI interactions", ->

    say "I try to open a modal dialog", ->
      beforeEach ->
        TT.Dialog.open('<h1>hello!</h1>');

      it "should open a modal dialog with the html content specified", ->
        expect($('.modal-dialog h1').text()).toBe 'hello!'

      # This is flakey in Firefox
      xalso "I try to close the modal dialog by clicking on the overlay", ->
        beforeEach ->
          $('.modal-dialog-overlay').click()

        it "should close the dialog", ->
          expect($('.modal-dialog').length).toBe 0
