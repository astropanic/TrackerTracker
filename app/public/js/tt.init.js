
// Readymade columns
// TODO: Allow creating & saving custom columns and layouts

TT.Model.Column.add({
  name: 'Backlog',
  active: true,
  filter: function (story) {
    return story.current_state === 'unstarted';
  },
  onDragIn: function (story) {
    return { current_state: 'unstarted' };
  }
});

TT.Model.Column.add({
  name: 'Started',
  active: true,
  filter: function (story) {
    return story.current_state === 'started';
  },
  onDragIn: function (story) {
    return { current_state: 'started' };
  }
});

TT.Model.Column.add({
  name: 'In QA',
  active: true,
  filter: function (story) {
    return story.current_state === 'finished' && !TT.Model.Story.hasTag(story, 'passedqa');
  },
  onDragIn: function (story) {
    return { current_state: 'finished', labels: TT.Model.Story.addTag(story, 'inqa').labels };
  },
  onDragOut: function (story) {
    return { labels: TT.Model.Story.removeTag(story, 'inqa').labels };
  }
});

TT.Model.Column.add({
  name: 'Passed QA',
  active: true,
  filter: function (story) {
    return story.current_state === 'finished' && TT.Model.Story.hasTag(story, 'passedqa');
  },
  onDragIn: function (story) {
    return { current_state: 'finished', labels: TT.Model.Story.addTag(story, 'passedqa').labels };
  },
  onDragOut: function (story) {
    return { labels: TT.Model.Story.removeTag(story, 'passedqa').labels };
  }
});

TT.Model.Column.add({
  name: 'Delivered',
  active: true,
  filter: function (story) {
    return story.current_state === 'delivered';
  },
  onDragIn: function (story) {
    return { current_state: 'delivered' };
  }
});

TT.Model.Column.add({
  name: 'Accepted',
  active: true,
  filter: function (story) {
    return story.current_state === 'accepted';
  },
  onDragIn: function (story) {
    return { current_state: 'accepted' };
  }
});

// bind init to jQuery on DOM Ready

$(TT.onDomReady);
