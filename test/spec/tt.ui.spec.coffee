describe "UI interactions", ->

  describe "Tags", ->

    say "I click on a tag", ->

      it "should show up in the tag list", ->

      it "should only show stories with that matching tag", ->

      also "I click on an active tag in a story", ->

        it "should do nothing", ->

      also "I click on an active tag in the tag list", ->

        it "should disable that tag and filter", ->

  describe "Users", ->

    say "I click on a user in a story", ->

      it "should show up in the tag list", ->

      it "should only show stories with that matching user", ->

      also "I click on an active user in the tag list", ->

        it "should disable that tag and filter", ->

  describe "Columns", ->

    say "I click the close button on a column", ->

      it "should look disabled in the column list", ->

      it "should no longer be visible in the main content area", ->

      also "I click on the disabled column in the column list", ->

        it "should look enabled in the column list", ->

        it "should once again be visible in the main content area", ->

  describe "Projects", ->

    say "I click the project initials in a story", ->

      it "should only display that project as active in the project list", ->

      it "should be the only project visible in the main content area", ->

    say "I click a disabled project in the project list", ->

      it "should look enabled in the project list", ->

      it "should make the project stories visible in the main content area", ->

  describe "Search", ->
