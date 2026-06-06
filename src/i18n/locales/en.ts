/**
 * English language file for Axiom Planner
 * All UI strings organized by module/component
 */

export const en = {
  // ============================================
  // Common / Shared
  // ============================================
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    close: 'Close',
    search: 'Search',
    noResults: 'No results found',
    untitled: 'Untitled',
    noDate: 'No Date',
    select: 'Select...',
  },

  // ============================================
  // Sidebar Navigation
  // ============================================
  sidebar: {
    brandName: 'AXIOM',
    brandSubtitle: 'PLANNER',
    searchNode: 'Search Node',
    newNode: 'New Page Node',
    pinnedNodes: 'Pinned Nodes',
    notesAndPages: 'Notes & Pages',
    databases: 'Databases',
    discovery: 'Discovery',
    inbox: 'Inbox (Capture)',
    tagsIndex: 'Tags Index',
    noActiveTags: 'No active tags',
    maintenance: 'Maintenance',
    system: 'System',
    settings: 'Settings',
    dataIntegrity: 'Data Integrity',
    syncing: 'Syncing...',
    synced: 'Synced',
    forceSync: 'Force Sync',
    syncedAt: 'Synced T:',
    pinRail: 'Pin Rail',
    unpinRail: 'Unpin Rail',
    expiring: 'Expiring',
    criticalDeadlines: 'Critical: {count} deadlines expire within 24 hours!',
    configureSchemas: 'Configure & Manage Schemas',
    topologyMap: 'Topology Map',
    heineBorelTheorem: 'Heine–Borel Theorem',
  },

  // ============================================
  // Command Palette
  // ============================================
  commandPalette: {
    placeholder: 'Type a command or search...',
    noCommandsFound: 'No commands found',
    navigation: 'Navigation',
    documents: 'Documents',
    actions: 'Actions',
    system: 'System',
    projectHub: 'Project Hub',
    goToProject: 'Go to project overview',
    focusEditor: 'Focus Editor',
    openEditor: 'Open the document editor',
    createNewDocument: 'Create New Document',
    createUntitled: 'Create "{title}"',
    toggleZenMode: 'Toggle Zen Mode',
    exitZenMode: 'Exit Zen Mode',
    zenModeDescription: 'Enter distraction-free mode',
    exitZenModeDescription: 'Restore normal layout',
    forceSynthesis: 'Force Synthesis',
    triggerSynthesis: 'Trigger knowledge synthesis',
    created: 'Created "{title}"',
    failedToCreate: 'Failed to create document',
    zenModeActivated: 'Zen mode activated.',
    restoredLayout: 'Restored layout.',
    runningSynthesis: 'Running synthesis...',
  },

  // ============================================
  // Error Boundary
  // ============================================
  errorBoundary: {
    systemHalt: 'System Halt // Error Boundary',
    unexpectedError: 'An unexpected error has occurred',
    unknownError: 'An unknown runtime error interrupted the workspace execution.',
    restartWorkspace: 'Restart Workspace',
  },

  // ============================================
  // Quick Capture
  // ============================================
  quickCapture: {
    placeholder: 'Capture a fleeting thought...',
    enterHint: '↵',
  },

  // ============================================
  // Settings View
  // ============================================
  settings: {
    title: 'System Settings',
    subtitle: 'Manage application preferences and data persistence.',
    preferences: 'Preferences',
    themePreference: 'Theme Preference',
    themeSystem: 'System (Auto)',
    themeLight: 'Light Bauhaus',
    themeDark: 'Dark Bauhaus',
    editorFontSize: 'Editor Font Size',
    fontSizeSmall: 'Small (Compact)',
    fontSizeMedium: 'Medium (Standard)',
    fontSizeLarge: 'Large (Reading)',
    dataManagement: 'Data Management',
    exportDatabase: 'Export Database',
    exportDescription: 'Download your workspace as JSON backup',
    importDatabase: 'Import Database',
    importDescription: 'Restore your workspace from JSON backup',
    eraseWorkspace: 'Erase Workspace',
    eraseDescription: 'Factory reset local database',
    exportSuccess: 'Database exported successfully!',
    exportFailed: 'Failed to export data',
    importSuccess: 'Database imported successfully! Please refresh.',
    importFailed: 'Failed to import data: {error}',
    resetConfirm: 'Are you sure you want to clear ALL data? This cannot be undone.',
    resetSuccess: 'Database cleared. Reloading...',
    resetFailed: 'Failed to reset data',
    invalidBackupFormat: 'Invalid backup format',
  },

  // ============================================
  // Kanban Board
  // ============================================
  kanban: {
    title: 'Active Database Views',
    subtitle: 'Relational query and metadata aggregation views.',
    zettelkastenStages: 'Zettelkasten Stages',
    booksStatus: 'Books Status',
    engineOnline: 'Engine Online',
    compilingManuscript: 'Compiling Manuscript...',
    aggregatingRelations: 'Aggregating Relations...',
    fleeting: 'Fleeting',
    seedling: 'Seedling',
    evergreen: 'Evergreen',
    synthesis: 'Synthesis',
    terminal: 'Terminal',
    toRead: 'To Read / Backlog',
    currentlyReading: 'Currently Reading',
    completedBooks: 'Completed Books',
    stageA: 'STAGE A',
    stageB: 'STAGE B',
    stageC: 'STAGE C',
    startTyping: 'Start typing...',
    bookEntry: 'Book entry...',
    movedTo: 'Moved document style to {badge}',
    bookStatusSet: 'Book status set to {status}',
    failedToRearrange: 'Failed to rearrange object statuses.',
  },

  // ============================================
  // Graph View
  // ============================================
  graph: {
    title: 'Knowledge Graph',
    subtitle:
      'Visualize bidirectional links traversing your Zettelkasten. Double-click a node to edit.',
    scanningTopology: 'Scanning topology...',
  },

  // ============================================
  // Document Stats
  // ============================================
  documentStats: {
    characters: '字符',
    words: '字数',
    lines: '行数',
    size: '大小',
    capacityUsage: '容量使用',
    documentExceeded: '文档大小已超出限制',
    documentWarning: '文档大小接近限制',
    exceededMessage:
      '当前文档大小 ({current} 字符) 已超过限制 ({max} 字符)。建议导出或分拆文档以避免性能问题。',
    warningMessage: '文档大小已使用 {percentage}%，建议考虑导出或分拆文档。',
    exportDocument: '导出文档',
    splitDocument: '分拆文档',
    readOnlyMode: '只读模式',
    exitReadOnly: '退出只读模式',
  },

  // ============================================
  // Backlinks Panel
  // ============================================
  backlinks: {
    title: 'Linked Mentions (Backlinks)',
    noBacklinks: 'No backward linkages mapped.',
    topologyMathMain: 'Topology Math (Main)',
  },

  // ============================================
  // Type Manager
  // ============================================
  typeManager: {
    title: 'Manage Object Types',
    subtitle: 'The Capacities Way // Custom schemas and semantic labels',
    close: 'CLOSE',
    defineNewType: 'Define New Object Type',
    objectTypeName: 'Object Type Name',
    selectedIcon: 'Selected Icon',
    assignCustomIcon: 'Assign Custom Icon',
    createObjectType: 'CREATE OBJECT TYPE',
    currentSchemaDirectory: 'Current Schema Directory',
    systemStandard: 'System Standard',
    customSchema: 'Custom Schema',
    cardsCompiled: 'Cards Compiled',
    rename: 'Rename',
    deleteObjectType: 'Delete Object Type',
    cannotDeleteAssigned: 'Cannot delete: assigned to active cards',
    pleaseEnterName: 'Please enter an object type name.',
    invalidName: 'Invalid name. Type ID cannot be empty.',
    typeExists: 'A type with ID "{id}" already exists.',
    createdSuccess: 'Successfully registered "{name}" object type!',
    failedToCreate: 'Failed to create new object type.',
    systemTypesCannotBeDeleted: 'System standard object types cannot be deleted.',
    cannotDeleteInUse: 'Cannot delete type "{id}": It is currently assigned to {count} documents.',
    deleteConfirm: 'Are you sure you want to delete the "{id}" object type?',
    deletedSuccess: 'Deleted "{id}" object type.',
    failedToDelete: 'Failed to delete object type.',
    nameCannotBeEmpty: 'Name cannot be empty.',
    updatedSuccess: 'Updated object type name.',
    failedToUpdate: 'Failed to update name.',
    iconUpdated: 'Updated icon to {icon}',
    failedToUpdateIcon: 'Failed to update icon.',
    placeholderExample: 'e.g. Restaurant, Paper, Client',
  },

  // ============================================
  // Database View
  // ============================================
  database: {
    title: 'Workspace Directory',
    records: 'records',
    inboxSubtitle: 'Inbox capturing workspace: uncategorized drafts needing processing.',
    maintenanceSubtitle:
      'Database boundaries analyzer: displaying isolated cards lacking bilateral link connections.',
    tagSubtitle: 'Tag index query: documents tagged with #{tag}.',
    typeSubtitle: 'Object Type slice: display records of category "{type}".',
    defaultSubtitle: 'Universal library index supporting dynamic categorization.',
    resetFilter: 'Reset filter',
    table: 'Table',
    gallery: 'Gallery',
    calendar: 'Calendar',
    noMatches: 'No matches compiled',
    tryCreating: 'Try creating a new card or clearing active taxonomy filters.',
    noAttachments: 'No attachments compiled',
    tryAttaching: 'Try attaching an image to a card via drag-and-drop or paste.',
    compiling: 'Compiling...',
    untitledNode: 'Untitled Node',
    emptyCanvas: 'Empty canvas note...',
    nodeTitle: 'Node Title',
    category: 'Category',
    badge: 'Badge',
    nodeDate: 'Node Date',
    inboxDraft: 'Inbox Draft',
    untagged: 'Untagged',
    documentRenamed: 'Document renamed.',
    dateUpdated: 'Date updated.',
    editDocument: 'Edit Document',
    assignStatusBadge: 'Assign Status Badge',
    deletePermanently: 'Delete permanently',
    documentDeleted: 'Document deleted.',
    badgeUpdated: 'Badge updated to {badge}.',
    prev: 'Prev',
    today: 'Today',
    next: 'Next',
    // Maintenance View
    connectionHealth: 'Workspace Connection Health',
    organizedGraph: 'organized graph',
    connectedNodes: 'Connected Nodes',
    total: 'total',
    nodesHaveLinks: 'Nodes have active bidirectional links or properties.',
    isolatedOrphaned: 'Isolated/Orphaned Cards',
    reviewNeeded: 'review needed',
    lackingBacklinks: 'Lacking bidirectional backlinks or custom metadata links.',
    perfectlyConnected: 'Workspace Perfectly Connected',
    allDocumentsIntegrated:
      'All documents are integrated with relations and bidirectional references.',
    isolatedCardsCleanup: 'Isolated Cards Quick Cleanup Deck',
    untitledIsolated: 'Untitled isolated card',
    setCategory: 'Set Category',
    linkToCard: 'Link To Card',
    unlinkedNode: 'Unlinked node',
    openNode: 'Open Node',
    categorizedAs: 'Categorized "{title}" as {type}',
    connectedToGraph: 'Connected "{title}" to database context graph!',
    permanentlyDeleted: 'Permanently deleted orphaned node.',
    // Gallery View
    up: 'Up:',
    deleteConfirm: 'Delete this card permanently?',
    clearedFilters: 'Cleared directory search filters.',
  },

  // ============================================
  // Timeline View
  // ============================================
  timeline: {
    title: 'Lines of Research',
    subtitle: 'Gantt tracks of active research directions and papers.',
    topologyFoundations: 'Topology Foundations',
    axiomaticSetup: 'Axiomatic Setup',
    publicBeta: 'Public Beta',
    heineBorelExt: 'Heine–Borel Ext.',
    euclideanMap: 'Euclidean Map',
    unify: 'Unify',
  },

  // ============================================
  // Schedule View
  // ============================================
  schedule: {
    title: 'Axiom Planner',
    subtitle:
      'Pluralistic task ledger bridging structural database relations and raw markdown checklists.',
    generateDailyJournal: 'Generate Daily Journal',
    calendar: 'Calendar',
    kanban: 'Kanban',
    deadlineShifter: 'System Deadline Range Shifter Tool',
    startRangeDate: 'Start Range Date',
    endRangeDate: 'End Range Date',
    daysShiftDelta: 'Days Shift Delta',
    shiftDeadlines: 'Shift Deadlines',
    quickEventAdder: 'Quick Event Adder',
    quickAddPlaceholder: 'e.g. Proof Heine-Borel theorem @2026-06-12 !High',
    syntaxHint: 'Support natural syntax patterns like',
    addTaskEvent: 'Add Task Event',
    activeGoalsIndex: 'Active Goals Index',
    hideComplete: 'Hide Complete',
    showComplete: 'Show Complete',
    filterSearch: 'Filter search list...',
    noActiveItems: 'No active items matching setup filters.',
    overdue: 'Overdue',
    upcoming: 'Upcoming',
    noDate: 'No Date',
    inlineTask: 'Inline Task',
    scheduleEvent: 'Schedule Event',
    taskTitle: 'Task Title',
    scheduleDate: 'Schedule Date',
    priority: 'Priority',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    scheduleTask: 'Schedule Task',
    updatedChecklist: 'Updated checklist task state.',
    failedToChangeChecklist: 'Failed to change checklist item.',
    statusSetTo: 'Set status to {status}.',
    failedToModifyStatus: 'Failed to modify object status.',
    prunedTask: 'Pruned Task document.',
    failedToDelete: 'Failed to delete.',
    scheduledNewTask: 'Scheduled new task.',
    failedToQuickSchedule: 'Failed to quick-schedule card.',
    scheduledFor: 'Scheduled Task for {date}',
    failedToCreatePlanned: 'Failed to create planned task.',
    specifyBothDates: 'Please specify both start and end boundary dates.',
    shiftComplete: 'Deadline shift complete: updated {count} records by {days} day(s)!',
    shiftError: 'An error occurred during relational deadline shifting.',
    generatedJournal: 'Successfully generated Daily Journal. Opening editor...',
    failedToGenerateJournal: 'Failed to construct daily journal workspace draft.',
    updatedTaskDeadline: 'Updated Task deadline to {date}',
    rescheduledProject: 'Rescheduled Project deadline to {date}',
    updatedInlineDeadline: 'Updated Inline deadline to {date}',
    dragSchedulingFailed: 'Drag scheduling failed.',
    dailyJournalTitle: 'Daily Journal: {date}',
    scheduledActiveTasks: 'Scheduled Active Tasks (Unfinished)',
    theseActiveDuties:
      'These active duties are mapped automatically from your Axiom Planner database:',
    structuralObjectGoals: 'Structural Objects Goals',
    noPendingObjectGoals: 'No pending high-level object goals currently scheduled.',
    markdownChecklists: 'Markdown Checklists Tasks',
    noPendingInline: 'No pending inline markdown checkboxes mapped.',
    mindfulReflections: 'Mindful Reflections & Intention Setting',
    todaysPrimaryFocus: "Today's Primary Focus Word",
    coreIntentions: 'Core Intentions',
    whatWentWell: 'What Went Well / Academic Discoveries',
    reflectOnCompleted: 'Reflect on what you completed or researched today...',
    impedimentsBlockers: 'Impediments & Blockers',
    addBlockingNotes:
      'Add notes on blocking elements, or tasks needing rescheduling for tomorrow...',
    focusPlaceholder: 'Focus...',
    taskAddedVia: 'Task added via Workspace Scheduler quick input.',
    draftGoalScope: 'Draft goal scope',
    goalInitialization: 'Goal initialization',
    taskScheduledOn: 'Task scheduled on date {date}.',
  },

  // ============================================
  // Editor Page
  // ============================================
  editor: {
    activeWorkspace: 'Active Workspace',
    contextPanel: 'Context Panel',
    splitPane: 'Split Pane',
    untitledNode: 'Untitled Node',
    metadataAggregated: 'Metadata aggregated! Saved as frontmatter Markdown.',
    failedToAggregate: 'Failed to aggregate and export node YAML metadata.',
    marginaliaComments: 'Marginalia & Comments',
    lineCloseness: 'Line 3 / Closeness',
    closenessQuote: '"bridges the intuitive notion of closeness..."',
    closenessNote:
      'Note: Closeness is modeled strictly via topology neighborhoods, distinct from metric distance bounds.',
    heineBorelExt: 'Heine–Borel Ext.',
    heineBorelQuote: '"Generalizing the Heine–Borel theorem..."',
    heineBorelNote:
      'Closed and bounded in general topological vector spaces fails to imply compactness without metric completeness.',
  },

  // ============================================
  // Toast Messages
  // ============================================
  toast: {
    newNoteCreated: 'New node created.',
    failedToCreateNode: 'Failed to create node.',
    failedToLoadBacklinks: 'Failed to load backlinks',
  },
} as const;

export type Translations = typeof en;
