describe "Init process", ->

  beforeEach ->
    TT.Init.init()

  describe "#init", ->

    it "should render the project list nav", ->
      expect($('#projects .project').length).toBeGreaterThan 0

    it "should render the column list nav", ->
      expect($('#columnList .column-selector').length).toBeGreaterThan 0

    it "should render the page columns", ->
      expect($('#columns .column').length).toBeGreaterThan 0
