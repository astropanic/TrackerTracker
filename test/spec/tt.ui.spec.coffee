describe "UI interactions", ->

  beforeEach ->
    TT.Init.onDomReady()

  describe "Tags", ->
    tagName = 'blocked'

    say "I click on a tag", ->
      beforeEach ->
        $('.story .tag:contains("' + tagName + '")').click()

      it "should show up in the filter list", ->
        expect($('#filters .filter').text()).toContain tagName

      it "should only show stories with that matching tag", ->
        expect(visibleStoriesWithoutTag(tagName)).toBe 0
        expect(visibleStoriesWithTag(tagName)).toBe 1

      also "I click on an active tag in a story", ->
        beforeEach ->
          $('.story .tag:contains("' + tagName + '")').click()

        it "should do nothing", ->
          expect($('#filters .filter:contains("' + tagName + '")').hasClass('inactive')).toBe false

      also "I click on an active tag in the tag list", ->
        beforeEach ->
          $('#filters .filter:contains("' + tagName + '")').click()

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
          $('#filters .filter:contains("' + owner + '")').click()

        it "should disable that filter", ->
          expect($('#filters .filter:contains("' + owner + '")').hasClass('inactive')).toBe true

        it "should show stories without the matching user", ->
          expect(visibleStoriesWithoutOwner(owner)).not.toBe 0

  describe "Columns", ->
    columnName = 'Started'

    say "I click the close button on a column", ->
      beforeEach ->
        $('#columns .column .column-title:contains("' + columnName + '") span').click()

      it "should look disabled in the column list", ->
        expect($('#columnList .column-selector:contains("' + columnName + '")').hasClass('active')).toBe false

      it "should no longer be visible in the main content area", ->
        expect($('#columns .column .column-title:contains("' + columnName + '")').length).toBe 0

      also "I click on the disabled column in the column list", ->
        beforeEach ->
          $('#columnList .column-selector:contains("' + columnName + '")').click()

        it "should look enabled in the column list", ->
          expect($('#columnList .column-selector:contains("' + columnName + '")').hasClass('active')).toBe true

        it "should once again be visible in the main content area", ->
          expect($('#columns .column .column-title:contains("' + columnName + '")').length).toBe 1

  describe "Stories", ->

    say "I open a story", ->
      beforeEach ->
        $('#story-103 .toggle-arrow').click()

      it "should display the story details", ->
        expect($('#story-103 .description').is(':visible')).toBe true

      also "I close the same story", ->
        beforeEach ->
          $('#story-103 .toggle-arrow').click()

        it "should hide the story details", ->
          expect($('#story-103 .description').is(':visible')).toBe false

  xdescribe "Projects", ->

    say "I click the project initials in a story", ->

      it "should only display that project as active in the project list", ->

      it "should be the only project visible in the main content area", ->

    say "I click a disabled project in the project list", ->

      it "should look enabled in the project list", ->

      it "should make the project stories visible in the main content area", ->

  xdescribe "Search", ->

    say "I perform a search", ->

      it "should display stories that contain the search term", ->
