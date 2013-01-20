describe "UI interactions", ->

  beforeEach ->
    TT.Init.init()

  describe "Settings", ->
    mockPivotalToken = 'my_new_token'

    say "I open the settings dialog", ->
      beforeEach ->
        $('#account-settings-link').click()

      it "should have an empty token field", ->
        expect($('#pivotal-token-input').val()).toBe 'abc123'
        expect($.cookie('pivotalToken')).toBe 'abc123'

      also "I update the token", ->
        beforeEach ->
          $('#pivotal-token-input').val(mockPivotalToken)
          $('#account-settings .form-action input').click()

        it "should save the token", ->
          expect($.cookie('pivotalToken')).toBe mockPivotalToken

        it "should close the dialog", ->
          expect($('#account-settings').length).toBe 0

        also "I re-open the settings dialog", ->
          beforeEach ->
            $('#account-settings-link').click()

          it "should display the saved token", ->
            expect($('#pivotal-token-input').val()).toBe mockPivotalToken

  describe "Tags", ->
    tagName = 'blocked'

    say "I click on a tag", ->
      beforeEach ->
        $('.story .tag:contains("' + tagName + '")').eq(0).click()

      it "should now show up in the filter list", ->
        expect($('#filters .filter').text()).toContain tagName

      it "should only show stories with that matching tag", ->
        expect(visibleStoriesWithoutTag(tagName)).toBe 0
        expect(visibleStoriesWithTag(tagName)).toBe 1

      also "I click on an active tag in a story", ->
        beforeEach ->
          $('.story .tag:contains("' + tagName + '")').eq(0).click()

        it "should do nothing", ->
          expect($('#filters .filter:contains("' + tagName + '")').hasClass('inactive')).toBe false

      also "I click on an active tag in the tag list", ->
        beforeEach ->
          $('#filters .filter:contains("' + tagName + '")').eq(0).click()

        it "should disable that filter", ->
          expect($('#filters .filter:contains("' + tagName + '")').hasClass('inactive')).toBe true

        it "should show stories without the matching tag", ->
          expect(visibleStoriesWithoutTag(tagName)).not.toBe 0

  describe "Users", ->
    owner = null

    beforeEach ->
      owner = $('.story .story-owner').eq(0).data('username')

    say "I click on a user in a story", ->
      beforeEach ->
        $('.story .story-owner').eq(0).click()

      it "should show up in the filter list", ->
        expect($('#filters .filter').text()).toContain owner

      it "should only show stories with that matching user", ->
        expect(visibleStoriesWithoutOwner(owner)).toBe 0

      also "I click on an active user in the filter list", ->
        beforeEach ->
          $('#filters .filter:contains("' + owner + '")').eq(0).click()

        it "should disable that filter", ->
          expect($('#filters .filter:contains("' + owner + '")').hasClass('inactive')).toBe true

        it "should show stories without the matching user", ->
          expect(visibleStoriesWithoutOwner(owner)).not.toBe 0

  describe "Columns", ->
    columnName = 'Started'

    say "I click the close button on a column", ->
      beforeEach ->
        $('#columns .column .column-title:contains("' + columnName + '") span').eq(0).click()

      it "should now look disabled in the column list", ->
        expect($('#columnList .column-selector:contains("' + columnName + '")').hasClass('active')).toBe false

      it "should no longer be visible in the main content area", ->
        expect($('#columns .column .column-title:contains("' + columnName + '")').length).toBe 0

      also "I click on the disabled column in the column list", ->
        beforeEach ->
          $('#columnList .column-selector:contains("' + columnName + '")').eq(0).click()

        it "should now look enabled in the column list", ->
          expect($('#columnList .column-selector:contains("' + columnName + '")').hasClass('active')).toBe true

        it "should once again be visible in the main content area", ->
          expect($('#columns .column .column-title:contains("' + columnName + '")').length).toBe 1

  describe "Stories", ->
    id = null
    project_id = null
    original_description = null
    edited_description = 'my edited description'

    beforeEach ->
      id = $('.story').eq(0).data('id')
      project_id = TT.Model.Story.get({ id: id }).project_id

    say "I open a story", ->
      beforeEach ->
        $('.story-' + id).find('.toggle-arrow').click()
        original_description = $('.story-' + id).find('.description').html()

      it "should display the story details", ->
        expect($('.story-' + id).find('.description').is(':visible')).toBe true

      also "I close the same story", ->
        beforeEach ->
          $('.story-' + id).find('.toggle-arrow').click()

        it "should hide the story details", ->
          expect($('.story-' + id).find('.description').is(':visible')).toBe false

      also "I start editing the story description", ->
        beforeEach ->
          $('.story-' + id).find('.description').click()
          $('.story-' + id).find('.description-container textarea').val(edited_description).blur()

        also "I trigger a redraw of the stories", ->
          beforeEach ->
            TT.View.drawStories()

          it "should restore the edited description", ->
            expect($('.story-' + id).find('.description-container textarea').val()).toBe edited_description

          also "I cancel the edit", ->
            beforeEach ->
              $('.story-' + id).find('.description-container .actions a.cancel').click()

            it "should restore the original description", ->
              expect($('.story-' + id).find('.description').html()).toBe original_description

        also "I save the edited description", ->
          beforeEach ->
            $('.story-' + id).find('.description-container .actions a.save').click()

          it "should save the description on the client-side", ->
            expect(TT.Model.Story.get({ id: id }).description).toBe edited_description

          it "should try to save the description on the server-side", ->
            expect($.ajax).toHaveBeenCalledWith {
              url: '/updateStory',
              type: 'POST',
              data: {
                projectID: project_id,
                storyID: id,
                data: {
                  description: edited_description
                }
              },
              complete: jasmine.any(Function)
            }

          it "should display the new description", ->
            expect($('.story-' + id).find('.description').html()).toBe edited_description

      also "I click the delete button on a tag", ->
        tagName = 'blocked'

        beforeEach ->
          $('.story-' + id).find('.details .tag:contains("' + tagName + '") .delete').eq(0).click()

        it "should delete the tag on the client-side", ->
          expect($('.story-' + id).find('.details .tag:contains("' + tagName + '")').length).toBe 0

        it "should delete the tag on the server-side", ->
          expect($.ajax).toHaveBeenCalledWith {
            url: '/updateStory',
            type: 'POST',
            data: {
              projectID: project_id,
              storyID: id,
              data: {
                labels: getLabelsString($('.story-' + id).find('.details .tag'))
              }
            },
            complete: jasmine.any(Function)
          }

      also "I start writing a note", ->
        my_note = 'Here is my note'

        beforeEach ->
          $('.story-' + id).find('.add-note').click()
          $('.story-' + id).find('.notes textarea').val(my_note).blur()

        also "I trigger a redraw of the stories", ->
          beforeEach ->
            TT.View.drawStories()

          it "should restore the note", ->
            expect($('.story-' + id).find('.notes textarea').val()).toBe my_note

        also "I cancel the note", ->
          beforeEach ->
            $('.story-' + id).find('.notes .actions a.cancel').click()

          it "should remove the note form", ->
            expect($('.story-' + id).find('.notes textarea').length).toBe 0
            expect($('.story-' + id).find('.add-note').length).toBe 1

        also "I save the note", ->
          beforeEach ->
            $('.story-' + id).find('.notes .actions a.save').click()

          it "should save the note on the client-side", ->
            expect(TT.Model.Story.get({ id: id }).notes[0].text).toBe my_note

          it "should save the note on the server-side", ->
            expect($.ajax).toHaveBeenCalledWith {
              url: '/addStoryComment',
              type: 'POST',
              data: {
                projectID: project_id,
                storyID: id,
                comment: my_note
              },
              complete: jasmine.any(Function)
            }

  describe "Projects", ->
    id = null

    beforeEach ->
      id = $('.story a.project-name').data('project-id')

    say "I click the project initials in a story", ->
      beforeEach ->
        $('.story a.project-name').eq(0).click()

      it "should only display that project as active in the project list", ->
        expect($('#project-' + id).siblings('.project').hasClass('inactive')).toBe true
        expect($('#project-' + id).hasClass('inactive')).toBe false

      it "should be the only project visible in the main content area", ->
        expect(visibleStoriesWithProjectID(id)).not.toBe 0
        expect(visibleStoriesWithoutProjectID(id)).toBe 0

    say "I click an enabled project in the project list", ->
      beforeEach ->
        $('#project-' + id).click()

      it "should now look disabled in the project list", ->
        expect($('#project-' + id).hasClass('inactive')).toBe true

      it "should hide the project stories in the main content area", ->
        expect(visibleStoriesWithProjectID(id)).toBe 0

      also "I click a disabled project in the project list", ->
        beforeEach ->
          $('#project-' + id).click()

        it "should now look enabled in the project list", ->
          expect($('#project-' + id).hasClass('inactive')).toBe false

        it "should make the project stories visible in the main content area", ->
          expect(visibleStoriesWithProjectID(id)).not.toBe 0
