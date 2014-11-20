defaults = require './defaults'
optionsValidator = require './validators/options'

# TODO: Should we be hooking in completers differently?
# TODO: https://github.com/ajaxorg/ace/blob/f133231df8c1f39156cc230ce31e66103ef4b1e2/lib/ace/ext/language_tools.js#L202

# TODO: Should show popup if we have a snippet match in Autocomplete.filterCompletions
# TODO: https://github.com/ajaxorg/ace/blob/695e24c41844c17fb2029f073d06338cd73ec33e/lib/ace/autocomplete.js#L449

# TODO: Create list of manual test cases

module.exports = class Zatanna
  Tokenizer = ''
  BackgroundTokenizer = ''

  constructor: (aceEditor, options) ->
    {Tokenizer} = ace.require 'ace/tokenizer'
    {BackgroundTokenizer} = ace.require 'ace/background_tokenizer'

    @editor = aceEditor
    config = ace.require 'ace/config'

    options ?= {}

    defaultsCopy = _.extend {}, defaults
    @options = _.merge defaultsCopy, options

    validationResult = optionsValidator @options
    unless validationResult.valid
      throw new Error "Invalid Zatanna options: " + JSON.stringify(validationResult.errors, null, 4)

    ace.config.loadModule 'ace/ext/language_tools', () =>
      @snippetManager = ace.require('ace/snippets').snippetManager

      # Prevent tabbing a selection trigging an incorrect autocomplete
      # E.g. Given this.moveRight() selecting ".moveRight" from left to right and hitting tab yields this.this.moveRight()()
      # TODO: Figure out how to intercept this properly
      # TODO: Or, override expandSnippet command
      # TODO: Or, SnippetManager's expandSnippetForSelection
      @snippetManager.expandWithTab = -> return false

      # Define a background tokenizer that constantly tokenizes the code
      highlightRules = new (@editor.getSession().getMode().HighlightRules)()
      tokenizer = new Tokenizer highlightRules.getRules()
      @bgTokenizer = new BackgroundTokenizer tokenizer, @editor
      aceDocument = @editor.getSession().getDocument()
      @bgTokenizer.setDocument aceDocument
      @bgTokenizer.start(0)

      @setAceOptions()
      @copyCompleters()
      @activateCompleter()
      @editor.commands.on 'afterExec', @doLiveCompletion

  setAceOptions: () ->
    aceOptions = 
      'enableLiveAutocompletion': @options.liveCompletion
      'enableBasicAutocompletion': @options.basic
      'enableSnippets': @options.completers.snippets

    @editor.setOptions aceOptions
    @editor.completer?.autoSelect = true

  copyCompleters: () ->
    @completers = {snippets: {}, text: {}, keywords: {}}
    if @editor.completers?
      [@completers.snippets.comp, @completers.text.comp, @completers.keywords.comp] = @editor.completers
    if @options.completers.snippets
      @completers.snippets = pos: 0
      # Replace the default snippet completer with our custom one
      @completers.snippets.comp = require('./completers/snippets') @snippetManager, @options.autoLineEndings
    if @options.completers.text
      @completers.text = pos: 1
      # Replace default text completer with custom one
      @completers.text.comp = require('./completers/text') @editor, @bgTokenizer, @completers.snippets.comp
    if @options.completers.keywords
      @completers.keywords = pos: 2

  activateCompleter: (comp) ->
    if Array.isArray comp
      @editor.completers = comp
    else if typeof comp is 'string'
      if @completers[comp]? and @editor.completers[@completers[comp].pos] isnt @completers[comp].comp
        @editor.completers.splice(@completers[comp].pos, 0, @completers[comp].comp)
    else 
      @editor.completers = []
      for type, comparator of @completers
        if @options.completers[type] is true
          @activateCompleter type 

  addSnippets: (snippets, language) ->
    @options.language = language
    ace.config.loadModule 'ace/ext/language_tools', () =>
      @snippetManager = ace.require('ace/snippets').snippetManager
      snippetModulePath = 'ace/snippets/' + language
      ace.config.loadModule snippetModulePath, (m) => 
        if m?
          @snippetManager.files[language] = m 
          @snippetManager.unregister m.snippets if m.snippets?.length > 0
          @snippetManager.unregister @oldSnippets if @oldSnippets?
          m.snippets = if @options.snippetsLangDefaults then @snippetManager.parseSnippetFile m.snippetText else []
          m.snippets.push s for s in snippets
          @snippetManager.register m.snippets
          @oldSnippets = m.snippets

  setLiveCompletion: (val) ->
    if val is true or val is false
      @options.liveCompletion = val
      @setAceOptions()

  set: (setting, value) ->
    switch setting
      when 'snippets' or 'completers.snippets'
        return unless typeof value is 'boolean'
        @options.completers.snippets = value
        @setAceOptions()
        @activateCompleter 'snippets'
      when 'basic'
        return unless typeof value is 'boolean'
        @options.basic = value
        @setAceOptions()
        @activateCompleter()
      when 'liveCompletion'
        return unless typeof value is 'boolean'
        @options.liveCompletion = value
        @setAceOptions()
        @activateCompleter()
      when 'language'
        return unless typeof value is 'string'
        @options.language = value
        @setAceOptions()
        @activateCompleter()
      when 'completers.keywords'
        return unless typeof value is 'boolean'
        @options.completers.keywords = value
        @activateCompleter()
      when 'completers.text'
        return unless typeof value is 'boolean'
        @options.completers.text = value
        @activateCompleter()
    return

  doLiveCompletion: (e) =>
    # console.log 'Zatanna doLiveCompletion', e
    return unless @options.basic or @options.liveCompletion or @options.completers.snippets or @options.completers.text

    TokenIterator = TokenIterator or ace.require('ace/token_iterator').TokenIterator
    editor = e.editor
    text = e.args or ""
    hasCompleter = editor.completer and editor.completer.activated

    # We don't want to autocomplete with no prefix
    if e.command.name is "backspace"
      if (hasCompleter and not @getCompletionPrefix(editor))
        editor.completer?.detach()
    else if e.command.name is "insertstring"
      pos = editor.getCursorPosition()
      token = (new TokenIterator editor.getSession(), pos.row, pos.column).getCurrentToken()
      if token? and token.type not in ['comment', 'string']
        prefix = @getCompletionPrefix editor
        # Only autocomplete if there's a prefix that can be matched
        if (prefix and not hasCompleter)
          unless (editor.completer)
            # Create new autocompleter
            Autocomplete = ace.require('ace/autocomplete').Autocomplete

            # Overwrite "Shift-Return" and "Return" command to Esc + Return instead
            # https://github.com/ajaxorg/ace/blob/695e24c41844c17fb2029f073d06338cd73ec33e/lib/ace/autocomplete.js#L208
            # TODO: Need a better way to update this command.  This is super shady.
            # TODO: Shift-Return errors when Autocomplete is open, dying on this call:
            # TODO: calls editor.completer.insertMatch(true) in lib/ace/autocomplete.js
            if Autocomplete?.prototype?.commands?
              exitAndReturn = (editor) =>
                # TODO: Execute a proper Return or Shift-Return instead of simple \n insert
                editor.completer.detach()
                @editor.insert "\n"
              Autocomplete.prototype.commands["Shift-Return"] = exitAndReturn
              Autocomplete.prototype.commands["Return"] = exitAndReturn

            editor.completer = new Autocomplete()
          # Disable autoInsert
          editor.completer.autoSelect = true
          editor.completer.autoInsert = false
          editor.completer.showPopup(editor)
          
          # Update popup CSS after it's been launched
          # TODO: Popup has original CSS on first load, and then visibly/weirdly changes based on these updates
          # TODO: Find better way to extend popup.
          if editor.completer.popup?
            $('.ace_autocomplete').find('.ace_content').css('cursor', 'pointer')
            $('.ace_autocomplete').css('font-size', @options.popupFontSizePx + 'px') if @options.popupFontSizePx?
            $('.ace_autocomplete').css('width', @options.popupWidthPx + 'px') if @options.popupWidthPx?
            editor.completer.popup.resize?()

            # TODO: Can't change padding before resize(), but changing it afterwards clears new padding
            # TODO: Figure out how to hook into events rather than using setTimeout()
            # fixStuff = =>
            #   $('.ace_autocomplete').find('.ace_line').css('color', 'purple')
            #   $('.ace_autocomplete').find('.ace_line').css('padding', '20px')
            #   # editor.completer.popup.resize?(true)
            # setTimeout fixStuff, 1000

    # Update tokens for text completer
    if @options.completers.text and e.command.name in ['backspace', 'del', 'insertstring', 'removetolinestart', 'Enter', 'Return', 'Space', 'Tab']
      @bgTokenizer.fireUpdateEvent 0, @editor.getSession().getLength()

  getCompletionPrefix: (editor) ->
    # TODO: this is not used to get prefix that is passed to completer.getCompletions
    # TODO: Autocomplete.gatherCompletions is using this (no regex 3rd param):
    # TODO: var prefix = util.retrievePrecedingIdentifier(line, pos.column);
    util = util or ace.require 'ace/autocomplete/util'
    pos = editor.getCursorPosition()
    line = editor.session.getLine pos.row
    prefix = null
    editor.completers?.forEach (completer) ->
      if completer?.identifierRegexps
        completer.identifierRegexps.forEach (identifierRegex) ->
          if not prefix and identifierRegex
            prefix = util.retrievePrecedingIdentifier line, pos.column, identifierRegex
    prefix = util.retrievePrecedingIdentifier line, pos.column unless prefix?
    prefix

self.Zatanna = Zatanna if self?
window.Zatanna = Zatanna if window?