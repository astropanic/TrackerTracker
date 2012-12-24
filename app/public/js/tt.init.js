
// Readymade columns
// TODO: Allow creating & saving custom columns and layouts

TT.addColumn({
  name: 'Backlog',
  filter: function (story) {
    return story.current_state === 'unstarted';
  },
  onDragIn: function (story) {
    return { current_state: 'unstarted' };
  }
});

TT.addColumn({
  name: 'Started',
  filter: function (story) {
    return story.current_state === 'started';
  },
  onDragIn: function (story) {
    return { current_state: 'started' };
  }
});

TT.addColumn({
  name: 'In QA',
  filter: function (story) {
    return story.current_state === 'finished' && !TT.hasTag(story, 'passedqa');
  },
  onDragIn: function (story) {
    return { current_state: 'finished', labels: TT.addTag(story.labels, 'inqa') };
  },
  onDragOut: function (story) {
    return { labels: TT.removeTag(story.labels, 'inqa') };
  }
});

TT.addColumn({
  name: 'Passed QA',
  filter: function (story) {
    return story.current_state === 'finished' && TT.hasTag(story, 'passedqa');
  },
  onDragIn: function (story) {
    return { current_state: 'finished', labels: TT.addTag(story.labels, 'passedqa') };
  },
  onDragOut: function (story) {
    return { labels: TT.removeTag(story.labels, 'passedqa') };
  }
});

TT.addColumn({
  name: 'Delivered',
  filter: function (story) {
    return story.current_state === 'delivered';
  },
  onDragIn: function (story) {
    return { current_state: 'delivered' };
  }
});

TT.addColumn({
  name: 'Accepted',
  filter: function (story) {
    return story.current_state === 'accepted';
  },
  onDragIn: function (story) {
    return { current_state: 'accepted' };
  }
});

// bind init to jQuery on DOM Ready

$(TT.onDomReady);
