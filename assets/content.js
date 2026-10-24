/*
  VP Studio content file.
  Edit this file to change the current issue and the archive records.
  The layout files read from it; you should not need to touch them.
*/
window.VP = {
  issue: {
    label: 'Issue 08',
    date: 'October 2026',
    theme: 'Seeing Things',
    figureTitle: 'Figure 8.',
    figureCaption: 'A blot, folded once along this gutter. Almost everyone finds something in it.',
    classLabel: 'Class P / Perception / pareidolia',
    investigationLabel: 'Read Investigation 08',
    investigationHref: '/research'
  },

  /* Classification colors are set by hue range (OKLCH degrees). Ranges meet so the spectrum flows. */
  categories: {
    P: { name: 'Perception', hue: [32, 70] },
    A: { name: 'Attention', hue: [72, 110] },
    M: { name: 'Memory', hue: [112, 172] },
    C: { name: 'Cognition', hue: [174, 232] },
    E: { name: 'Emotion', hue: [234, 300] },
    X: { name: 'Experimental work', hue: [302, 376] }
  },

  /* Archive records. Order inside each category sets its place in the spectrum. Add href when a page exists. */
  records: [
    { cat: 'P', title: 'The triangle that isn’t there', type: 'Essay', dek: 'Illusory contours and the edges the brain supplies.' },
    { cat: 'P', title: 'Afterimages', type: 'Experiment', dek: 'Stare, look away, and see a color that isn’t printed.' },
    { cat: 'P', title: 'The vase that won’t settle', type: 'Essay', dek: 'Figure, ground and perceptual flipping.' },
    { cat: 'P', title: 'Why curves read as gentle', type: 'Note', dek: 'On curved and angular objects.' },
    { cat: 'P', title: 'Edges that exist only in you', type: 'Artwork', dek: 'A plate series built from inducers.' },
    { cat: 'P', title: 'Color under sodium light', type: 'Study', dek: 'How color constancy holds, and when it breaks.' },
    { cat: 'P', title: 'Faces in outlets', type: 'Note', dek: 'Pareidolia in everyday objects.' },
    { cat: 'A', title: 'Where the eye lands first', type: 'Experiment', dek: 'Tracking first fixations on a page.' },
    { cat: 'A', title: 'The pull of one red object', type: 'Essay', dek: 'Salience and the isolation effect.' },
    { cat: 'A', title: 'Missing the obvious', type: 'Essay', dek: 'Inattentional blindness in daily life.' },
    { cat: 'A', title: 'Motion at the edge of vision', type: 'Experiment', dek: 'Peripheral movement and the urge to look.' },
    { cat: 'A', title: 'Type that slows you down', type: 'Design investigation', dek: 'Legibility, friction and attention.' },
    { cat: 'A', title: 'Clutter and the tired mind', type: 'Note', dek: 'Visual load at the end of a day.' },
    { cat: 'A', title: 'Attention in the museum', type: 'Essay', dek: 'How long we really look at art.' },
    { cat: 'M', title: 'Which composition do you remember?', type: 'Experiment', dek: 'Recall across three levels of complexity.' },
    { cat: 'M', title: 'A kitchen, drawn from memory', type: 'Artwork', dek: 'Drawing a room that no longer exists.' },
    { cat: 'M', title: 'Familiar, but not too familiar', type: 'Essay', dek: 'Novelty, familiarity and preference.' },
    { cat: 'M', title: 'Ornament as a memory device', type: 'Design investigation', dek: 'Pattern, repetition and recall.' },
    { cat: 'M', title: 'Rooms we never entered', type: 'Note', dek: 'False familiarity in architecture.' },
    { cat: 'M', title: 'Patterns passed down', type: 'Study', dek: 'Rosemaling motifs across generations.' },
    { cat: 'M', title: 'Inherited seeing', type: 'Artwork', dek: 'Rosemaling reworked as research plates.' },
    { cat: 'C', title: 'Why easy feels true', type: 'Essay', dek: 'Processing fluency and belief.' },
    { cat: 'C', title: 'Line length and reading', type: 'Study', dek: 'Measure, rhythm and comprehension.' },
    { cat: 'C', title: 'Ambiguity as material', type: 'Essay', dek: 'Designing for more than one reading.' },
    { cat: 'C', title: 'Counting without counting', type: 'Experiment', dek: 'Seeing small quantities at a glance.' },
    { cat: 'C', title: 'Maps in our heads', type: 'Note', dek: 'Wayfinding and mental models.' },
    { cat: 'C', title: 'Complexity, organized', type: 'Design investigation', dek: 'Density that still reads.' },
    { cat: 'C', title: 'The grammar of icons', type: 'Note', dek: 'When a symbol stops needing a label.' },
    { cat: 'E', title: 'Awe and the height of a room', type: 'Essay', dek: 'Scale, ceilings and the feeling of more.' },
    { cat: 'E', title: 'Color and the mood of a page', type: 'Experiment', dek: 'Palette and the first impression.' },
    { cat: 'E', title: 'Comfort objects', type: 'Artwork', dek: 'Things we keep for how they feel.' },
    { cat: 'E', title: 'Watching someone dance', type: 'Essay', dek: 'Movement, empathy and the watching body.' },
    { cat: 'E', title: 'The ache of the unfinished', type: 'Note', dek: 'Incomplete forms and lingering attention.' },
    { cat: 'E', title: 'Beauty and reward', type: 'Essay', dek: 'What brain imaging can and can’t say about beauty.' },
    { cat: 'E', title: 'Tension and release', type: 'Design investigation', dek: 'Composition as emotional rhythm.' },
    { cat: 'X', title: 'Plate series 01: Inducers', type: 'Artwork', dek: 'Twelve plates built from missing wedges.' },
    { cat: 'X', title: 'Drawing a sound’s color', type: 'Artwork', dek: 'Cross-sensory sketches.' },
    { cat: 'X', title: 'A canvas that forgets', type: 'Experiment', dek: 'Shared drawing with fading strokes.' },
    { cat: 'X', title: 'Word jars', type: 'Experiment', dek: 'One word each, sorted into three containers.' },
    { cat: 'X', title: 'The Völva Eye Test', type: 'Experiment', dek: 'What your eyes reach for first.' },
    { cat: 'X', title: 'A machine you assemble', type: 'Experiment', dek: 'Build a boat and watch how it moves.' },
    { cat: 'X', title: 'A typeface that changes as you read', type: 'Artwork', dek: 'Letterforms that respond to attention.' }
  ]
};
